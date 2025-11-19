import redisClient from "../cache/radis.js";
import Url from "../models/url.schema.js";
import { shortCode } from "../utils/shortid.js";
import { validUrlRegex } from "../utils/regex.js";
import mongoose from "mongoose";  

// Helper function to safely parse Redis data
// Upstash Redis may return objects directly or JSON strings
function parseRedisData(data) {
    if (!data) return null;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    }
    return data;
}

// GET: Dashboard Page
export async function Dashboard(req, res) {
    try {
        // Fetch all links for the table
        const allLinks = await Url.find({}).sort({ createdAt: -1 }).limit(50);

        res.render("dashboard", {
            links: allLinks,
            shortUrl: null,
            error: null,
            success: null,
            baseUrl: process.env.BASE_URL || 'http://localhost:8001'
        });
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).render("dashboard", {
            links: [],
            shortUrl: null,
            error: "Failed to load dashboard",
            success: null,
            baseUrl: process.env.BASE_URL || 'http://localhost:8001'
        });
    }
}


// GET: Stats Page 
export async function statsPage(req, res) {
    try {

        const code = req.params.code;

        const link = await Url.findOne({ code });

        if (!link) {
            return res.status(404).render("404", {
                message: "Link not found"
            });
        }

        return res.render("stats", {
            link,
            baseUrl: process.env.BASE_URL || 'http://localhost:8001'
        });

    } catch (err) {
        console.error("Error in statsPage:", err);
        return res.status(500).render("error", { error: err.message });
    }
}


// API Endpoints 

// POST: Create Short URL
export async function handleNcreateurl(req, res) {
    try {
        const { url, customCode } = req.body;
        // console.log("Create URL - URL:", url, "Custom Code:", customCode);

      
        if (!url) {
            return res.status(400).json({
                error: "URL is required!"
            });
        }

        if (!validUrlRegex(url)) {
            return res.status(400).json({
                error: "Invalid URL format"
            });
        }

        //code: use custom or generate
        let code;

        if (customCode && customCode.trim()) {
            code = customCode.trim();

    
            const codeRegex = /^[A-Za-z0-9]{6,8}$/;
            if (!codeRegex.test(code)) {
                return res.status(400).json({
                    error: "Custom code must be 6-8 alphanumeric characters (letters and numbers only)"
                });
            }

            // Check if code already exists (MUST return 409)
            const existingCode = await Url.findOne({ code });
            if (existingCode) {
                return res.status(409).json({
                    error: "Code already exists. Please choose a different code."
                });
            }
        } else {
            // Generate unique code
            code = shortCode();

            // Ensure generated code doesn't exist
            let attempts = 0;
            while (await Url.findOne({ code }) && attempts < 5) {
                code = shortCode();
                attempts++;
            }
        }

        // Check if URL already exists
        const existingUrl = await Url.findOne({ url });
        if (existingUrl && !customCode) {
            // URL exists and user didn't request custom code
            // Return existing link
            await redisClient.set(url, JSON.stringify(existingUrl), {
                EX: 60 * 60 * 24
            }).catch(err => console.error("Redis set error:", err));

            return res.status(200).json({
                code: existingUrl.code,
                url: existingUrl.url,
                shortUrl: `${process.env.BASE_URL || 'http://localhost:8001'}/${existingUrl.code}`,
                clicks: existingUrl.clicks,
                createdAt: existingUrl.createdAt,
                lastClicked: existingUrl.lastClicked
            });
        }

        // Create new short URL
        const newUrl = await Url.create({
            code,
            url,
            clicks: 0,
            lastClicked: null,
            createdAt: new Date()
        });

        // Store in Redis (cache by both URL and code)
        await Promise.all([
            redisClient.set(url, JSON.stringify(newUrl), { EX: 60 * 60 * 24 }),
            redisClient.set(code, JSON.stringify(newUrl), { EX: 60 * 60 * 24 })
        ]).catch(err => console.error("Redis set error:", err));

        return res.status(201).json({
            code: newUrl.code,
            url: newUrl.url,
            shortUrl: `${process.env.BASE_URL || 'http://localhost:8001'}/${newUrl.code}`,
            clicks: newUrl.clicks,
            createdAt: newUrl.createdAt,
            lastClicked: newUrl.lastClicked
        });

    } catch (err) {
        console.error("Error creating URL:", err);
        return res.status(500).json({ error: err.message });
    }
}


// GET: Redirect Short URL
export async function redirectUrl(req, res) {
    try {
        const code = req.params.code;

        if (!code) {
            return res.status(404).render("404", {
                message: "Invalid short link code"
            });
        }

        // Try Redis first
        const cached = await redisClient.get(code);
        if (cached) {
            // Use helper to safely parse Redis data
            const data = parseRedisData(cached);

            // Update analytics asynchronously (don't wait)
            Url.updateOne(
                { code },
                { $inc: { clicks: 1 }, lastClicked: new Date() }
            ).exec().catch(err => console.error("Analytics update error:", err));

            return res.status(302).redirect(data.url);
        }

        // Not in Redis → check DB
        const urlDoc = await Url.findOne({ code });
        if (!urlDoc) {
            return res.status(404).render("404", {
                message: "The short link you're looking for doesn't exist or has been deleted."
            });
        }

        // Cache it (Upstash handles JSON serialization)
        await redisClient.set(code, JSON.stringify(urlDoc), {
            EX: 60 * 60 * 24
        }).catch(err => console.error("Redis set error:", err));

        // Update analytics
        urlDoc.clicks += 1;
        urlDoc.lastClicked = new Date();
        await urlDoc.save();

        return res.status(302).redirect(urlDoc.url);  // MUST be 302

    } catch (err) {
        console.error("Redirect error:", err);
        return res.status(500).render("404", {
            message: "An error occurred while processing your request"
        });
    }
}


// GET: List all links (API)
export async function getAllLinks(req, res) {
    try {
        
        const allLinks = await Url.find({}).sort({ createdAt: -1 });

        // Format response
        const formatted = allLinks.map(link => ({
            code: link.code,
            url: link.url,
            clicks: link.clicks,
            lastClicked: link.lastClicked,
            createdAt: link.createdAt
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        console.error("Error in getAllLinks:", err);
        return res.status(500).json({ error: err.message });
    }
}


// GET: Single link stats (API)
export async function getLinkStats(req, res) {
    try {
        const code = req.params.code;

        const link = await Url.findOne({ code });
        if (!link) {
            return res.status(404).json({ error: "Link not found" });
        }

        return res.status(200).json({
            code: link.code,
            url: link.url,
            clicks: link.clicks,
            lastClicked: link.lastClicked,
            createdAt: link.createdAt
        });

    } catch (err) {
        console.error("Error in getLinkStats:", err);
        return res.status(500).json({ error: err.message });
    }
}


// DELETE: Delete link (API)
export async function deleteLink(req, res) {
    try {
        const code = req.params.code;

        // Find and delete
        const link = await Url.findOne({ code });
        if (!link) {
            return res.status(404).json({ error: "Link not found" });
        }

        await Url.deleteOne({ code });

        // Remove from Redis cache (both code and URL)
        await Promise.all([
            redisClient.del(code),
            redisClient.del(link.url)
        ]).catch(err => console.error("Redis delete error:", err));

        return res.status(200).json({
            message: "Link deleted successfully",
            code
        });

    } catch (err) {
        console.error("Error in deleteLink:", err);
        return res.status(500).json({ error: err.message });
    }
}


// GET: Health check
export async function healthCheck(req, res) {
    try {
        // Check MongoDB connection
        // console.log(mongoose.connection.readyState);
        
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        // Check Redis connection
        let redisStatus = 'disconnected';
        try {
            await redisClient.ping();
            redisStatus = 'connected';
        } catch (err) {
            console.error("Redis ping failed:", err);
        }

        return res.status(200).json({
            ok: true,
            version: "1.0.0",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: dbStatus,
            redis: redisStatus
        });

    } catch (err) {
        return res.status(503).json({
            ok: false,
            error: err.message
        });
    }
}
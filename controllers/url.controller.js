import redisClient from "../cache/radis.js";
import Url from "../model/urlSchema.js";
import { shortid } from "../utils/shortid.js";
import { validUrlRegex } from "../utils/regex.js";

// GET home page    
export async function home(req, res) {
    res.render('home', { shortUrl: null, error: null });
}

// POST request to create and handle URL
export async function handleNcreateurl(req, res, next) {
    try {
        if (Object.keys(req.body).length === 0)
            return res.status(400).send({ status: false, message: 'please provide data, body should not be empty' });

        const { longUrl } = req.body;

        if (!longUrl) {
            return res.render("home", { shortUrl: null, error: "URL is required!" });
        }

        if (!validUrlRegex(longUrl)) {
            return res.render("home", { shortUrl: null, error: "Invalid URL Provided." });
        }

        const cachedUrl = await redisClient.get(longUrl);
        if (cachedUrl) {
            const url = JSON.parse(cachedUrl);
            return res.render("home", { shortUrl: url.shortUrl, error: null });
        }

        const existingUrl = await Url.findOne({ longUrl }).select({ _id: 0, __v: 0 });
        if (existingUrl) {
            await redisClient.set(longUrl, JSON.stringify(existingUrl), { EX: 60 * 60 * 24 * 2 });
            return res.render("home", { shortUrl: existingUrl.shortUrl, error: null });
        }

        const shortId = shortid();
        const shortUrl = `http://localhost:8001/${shortId}`;

        const response = await Url.create({ shortid: shortId, shortUrl, longUrl });

        if (!response) {
            return res.render("home", { shortUrl: null, error: "Failed to create short URL." });
        }

        res.render("home", { shortUrl: response.shortUrl, error: null });

    } catch (err) {
        return res.status(500).render("home", { shortUrl: null, error: err.message });
    }
}

// GET redirect from short URL
export async function redirectUrl(req, res, next) {
    try {
        let shortId = req.params.id;
        if (!shortId) {
            return res.status(400).send({ message: "Invalid URL" });
        }

     
        console.time("RedirectTime"); // ⏱ start timer
        const checkUrlinCache = await redisClient.get(shortId);
        if (checkUrlinCache) {
            let cachedUrl = JSON.parse(checkUrlinCache);
            console.log("After Redis");
            console.timeEnd("RedirectTime"); // ⏱ end timer
            return res.redirect(cachedUrl.longUrl);
        } else {
            let urls = await Url.findOne({ shortid: shortId });
            if (!urls || !urls.longUrl) {
                return res.status(404).json({ status: false, message: "URL not found" });
            }
            await redisClient.set(shortId, JSON.stringify(urls), {
                EX: 60 * 60 * 24 * 2,
            });

            console.log("Before Redis");
            console.timeEnd("RedirectTime"); // ⏱ end timer
            res.redirect(urls.longUrl);
        }
    } catch (err) { 
        res.status(500).send({ status: false, message: err.message });
    }
}

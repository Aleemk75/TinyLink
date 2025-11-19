import express from "express"

const Router = express.Router();
import {
    Dashboard,
    handleNcreateurl,
    redirectUrl,
    getAllLinks,
    getLinkStats,
    deleteLink,
    healthCheck,
    statsPage
} from "../controllers/url.controller.js";

// Pages (SSR with EJS)

Router.get("/", Dashboard);                    // Dashboard with form + table
Router.get("/code/:code", statsPage);          // Stats page for a single link

// API Endpoints (JSON responses)

Router.post("/api/links", handleNcreateurl);      // Create link
Router.get("/api/links", getAllLinks);             // List all links
Router.get("/api/links/:code", getLinkStats);      // Get single link stats
Router.delete("/api/links/:code", deleteLink);     // Delete link


// Special Routes

Router.get("/healthz", healthCheck);               // Health check


// Redirect (MUST be last to avoid conflicts)

Router.get("/:code", redirectUrl);                 // Redirect to original URL

export default Router;
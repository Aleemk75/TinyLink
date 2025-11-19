import express from "express";
import { connectdb } from "./utils/connectDB.js";
import path from 'path';
import { fileURLToPath } from 'url';
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

connectdb()
    .then(() => {
        console.log("connected to DB");

    })
    .catch((e) => {
        console.log(e);
    });


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; font-src 'self' https:");
    next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


import Router from "./routes/url.route.js";



app.use("/", Router);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
});
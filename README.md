# 🔗 URLite - A Url Shortening Microservice

A simple and efficient **URL Shortener** built with **Node.js, Express, MongoDB, and Redis**.  
This project takes long URLs and generates short, shareable links.  
It also uses **Redis caching** for faster redirects and improved performance.

---

## ✨ Features
- Shortens any long URL into a unique short link.
- Redirects short links back to the original URL.
- Uses **MongoDB** for persistence.
- Uses **Redis** for caching frequently accessed URLs.
- Simple REST API structure.
- Easy to deploy on Render / Railway / Vercel + Redis Cloud + MongoDB Atlas.

---

## 🖼️ Screenshots

### 1️⃣ Homepage / Input Page  
<img width="1366" height="647" alt="image" src="https://github.com/user-attachments/assets/299cc2aa-9093-435b-8348-ffe50a61c5b3" />



### 2️⃣ Shortened URL Preview  
<img width="1366" height="647" alt="image" src="https://github.com/user-attachments/assets/bbd6af34-cc55-4fe0-85de-32c42a24451c" />



---

## ⚙️ Installation & Setup

1. **Clone the repo**
   ```bash
   git clone <link>
   cd url-shortener


   Install dependencies

npm install


Set up environment variables
Create a .env file in the root directory:

PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/urlshortner
REDIS_URL=redis://default:<password>@<host>:<port>


Run the app

npm start


The app will start at 👉 http://localhost:5000

📡 API Endpoints

POST /shorten → Create a new short URL

Request body:


{ "longUrl": "https://example.com/very/long/link" }


GET /:shortId → Redirect to the original long URL


🔮 Tech Stack

Node.js + Express – Backend server

MongoDB + Mongoose – Database for storing URLs

Redis – Caching layer for faster lookups

Nodemon (dev) – Hot reloading during development

👤 Author

Aleem Khan

Check out my [LinkedIn Profile](https://www.linkedin.com/in/aleemkh4n/)



⭐ If you like this project, don’t forget to star the repo!




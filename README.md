# Brevio — Cyber URL Shortener 🔗

A next-gen URL shortener with a full analytics dashboard — shorten links, track every click in real time, and generate QR codes, all wrapped in a custom cyber-themed UI.

🔗 **Live Demo:** [brevio-url-shortner.onrender.com](https://brevio-url-shortner.onrender.com/)

## Features

- 🔗 **Instant shortening** — paste any long URL, get a short code back immediately
- 📊 **Click analytics** — every visit is timestamped and logged, visualized in a live line chart (Chart.js)
- 📱 **QR code generation** — every short link gets an auto-generated, downloadable QR code
- 💾 **Local link history** — recently shortened links are cached client-side via localStorage, with live click counts synced from the backend
- 🧬 **Collision-safe short IDs** — generation retries automatically if a short code collision occurs
- 🎨 **Cyber HUD UI** — fully custom design system (no UI framework), glitch text, scanlines, neon glow, built with hand-written CSS variables
- ⚙️ **Production-hardened backend** — server-side URL validation, try/catch error handling on every route, fail-fast startup if the DB connection isn't configured

## Tech Stack

**Frontend**
- Vanilla JavaScript (no framework)
- Chart.js — click analytics visualization
- Lucide Icons (version-pinned)
- Custom CSS — Google Fonts (Orbitron, Share Tech Mono, Outfit)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- short-id — short code generation with collision retry
- dotenv — environment-based configuration

**Deployment**
- Render (single service — Express serves both the API and the static frontend)
- MongoDB Atlas

## How Click Tracking Works

Every short link's schema stores a `visitHistory` array. On each redirect hit (`GET /:shortId`), the server pushes a new timestamp into that array via `findOneAndUpdate` before redirecting the user — so tracking never blocks or delays the redirect. The analytics panel then reads that history back, groups it by day, and renders it as a rolling 7-day chart.

## Project Structure

```
Brevio-URL/
├── models/
│   └── url.js          # Mongoose schema: shortId, redirectUrl, visitHistory
├── routes/
│   └── url.js           # POST / (shorten), GET /analytics/:shortId
├── public/               # Static frontend
│   ├── index.html
│   ├── app.js
│   └── style.css
├── connect.js            # MongoDB connection handler
├── index.js               # Express app entry point
└── package.json
```

## Getting Started Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or a local MongoDB instance)

### 1. Clone the repo
```bash
git clone https://github.com/Maithilicok/Brevio-URL-Shortner.git
cd Brevio-URL-Shortner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the project root:
```
MONGO_URI=your_mongodb_connection_string
PORT=8001
```

### 4. Run it
```bash
npm start
```
App runs at `http://localhost:8001`

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas (or local) connection string |
| `PORT` | Port for the Express server (Render sets this automatically in production) |

## Deployment

This project is deployed as a **single service** — Express serves the API routes and the static frontend from the same process, so there's no separate frontend deployment.

- **Render** — Build Command: `npm install`, Start Command: `npm start`, with `MONGO_URI` set in the Environment tab
- **MongoDB Atlas** — Network Access must allow `0.0.0.0/0` since Render's outbound IPs aren't static

⚠️ **DNS note:** `mongodb+srv://` connection strings rely on SRV DNS lookups. Some local networks (college/hostel Wi-Fi in particular) block or mishandle these lookups, causing `ECONNREFUSED` errors during local development. Switching your machine's DNS to `8.8.8.8` / `8.8.4.4` resolves this — it's a local network issue, not a MongoDB or code issue.

## License

MIT

# Deploying Brevio to Render (today)

## 1. MongoDB Atlas (5 min)
1. Create a free cluster at https://cloud.mongodb.com
2. Database Access → add a user + password
3. Network Access → Add IP → **Allow access from anywhere** (0.0.0.0/0) — needed since Render's IPs aren't static
4. Connect → Drivers → copy the connection string, replace `<password>` and add `/Brevio` before the `?`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/Brevio?retryWrites=true&w=majority
   ```

## 2. Push this project to GitHub
```bash
git init
git add .
git commit -m "Brevio - production ready"
git branch -M main
git remote add origin https://github.com/<you>/brevio.git
git push -u origin main
```

## 3. Render setup
1. https://render.com → New → Web Service → connect your repo
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Environment → add:
   - `MONGO_URI` = your Atlas connection string from step 1
   - (leave `PORT` unset — Render sets it automatically, and `index.js` already reads `process.env.PORT`)
5. Deploy

That's it — Render gives you a live `https://brevio-xxxx.onrender.com` URL.

## Notes
- Free Render web services spin down after inactivity; first request after idle takes ~30-50s to wake up. Fine for a demo/portfolio link, not for real traffic.
- If you outgrow the free `short-id` package's collision risk, swap it for `nanoid` — the app already retries on collision either way.

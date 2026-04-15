<<<<<<< HEAD
# Subscription Dashboard

A full-stack React + Node.js + MongoDB subscription dashboard with login for both users and admins.

## Setup

### Backend
1. Open a terminal in `server`
2. Run `npm install`
3. Copy `.env.example` to `.env`
4. Start the server:
   - `npm run dev` (requires nodemon)
   - or `npm start`

### Frontend
1. Open a terminal in `client`
2. Run `npm install`
3. Start the UI:
   - `npm run dev`

## Default accounts

- Admin: `admin@example.com` / `Admin@123`
- User: `user@example.com` / `User@123`

## Notes

- The backend seeds these accounts automatically on first run.
- React app runs on `http://localhost:3000`
- Backend API runs on `http://localhost:5000`

## Deploy

This repo is now set up to deploy as a single Node service that serves the built React app from Express.

### Render
1. Push this repo to GitHub.
2. Create a new Blueprint or Web Service on Render.
3. Use the included `render.yaml`.
4. Set:
   - `MONGO_URI`
   - `JWT_SECRET`
5. Deploy.

### Local production build
1. From the repo root run `npm run build`
2. Start the app with `npm start`
=======
# Subscription-Based-Content-Access-System
A full-stack subscription management system built using the MERN stack. It allows users to manage subscriptions, track usage, and monitor activity through an interactive dashboard with analytics.
>>>>>>> f2d3b077307c3c265343642044c428628bb02731

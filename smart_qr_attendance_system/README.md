# Smart QR Attendance Management System

A full-stack solution built with Node.js/Express, Supabase (PostgreSQL), and React.

## Deployment Setup Guide

### 1. Supabase Setup
- Create a new project on [Supabase](https://supabase.com).
- Go to the SQL Editor and execute the code in `schema.sql`.
- Grab your `Project URL` and `service_role` key from Settings -> API.

### 2. VS Code & Local Testing
- Clone or unzip this project directory into VS Code.
- Copy `.env.example` to `.env` and fill in your Supabase & JWT details.
- Run `npm install` then `npm run dev`.

### 3. Deploy Backend on Render
- Push your backend code to GitHub.
- Create a Web Service on [Render](https://render.com).
- Set Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
  - `ALLOWED_ORIGIN` (Your Namecheap domain URL)
- Set Build Command: `npm install`
- Set Start Command: `npm start`

### 4. Deploy Frontend on Namecheap / Static Host
- Build your React app (`npm run build`).
- Upload the contents of the `dist` or `build` folder to `public_html` via Namecheap cPanel File Manager or FTP.
- Point your API calls to your Render URL (`https://your-backend.onrender.com`).

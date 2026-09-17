# EduIntern — Fast Zero-Error Deployment Guide

This project consists of:
1. **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS)
2. **Backend**: FastAPI (Python, SQLAlchemy, SQLite/PostgreSQL)

---

## ⚡ Fastest & Recommended Setup (Zero Errors)

The gold-standard zero-error deployment is:
* **Backend** on **Render** (Free Python Web Service)
* **Frontend** on **Vercel** (Free Next.js Platform — 60-second deploy)

---

### Step 1: Deploy Backend on Render (3 Minutes)

1. Go to [**render.com**](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Select your repository: `patilritesh2006-lgtm/smart-internship-monitoring`.
4. Configure these fields:
   * **Name**: `eduintern-backend`
   * **Region**: Choose closest to you (e.g., Oregon / Singapore / Frankfurt)
   * **Branch**: `main`
   * **Root Directory**: `.` (leave default)
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r backend/requirements.txt`
   * **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: `Free`
5. Click **Advanced** → **Add Environment Variable**:
   * `ENVIRONMENT` = `production`
   * `SECRET_KEY` = `university-smart-internship-secure-jwt-secret-key-32-chars-min`
   * `CORS_ORIGINS` = `*`
6. Click **Create Web Service**.
7. Once deployed, copy your Render backend URL (e.g., `https://eduintern-backend.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel (1 Minute)

1. Go to [**vercel.com**](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import your repository: `patilritesh2006-lgtm/smart-internship-monitoring`.
4. Configure Project Settings:
   * **Framework Preset**: `Next.js` (automatically detected)
   * **Root Directory**: Click `Edit` and select `frontend`
5. Under **Environment Variables**, add:
   * **Key**: `NEXT_PUBLIC_API_URL`
   * **Value**: `https://eduintern-backend.onrender.com/api` *(replace with your Render backend URL + `/api`)*
6. Click **Deploy**.
7. In ~45 seconds, your live EduIntern application will be live at `https://your-project.vercel.app`! 🎉

---

## 🚀 Alternative: All-in-One on Render (Blueprint Deploy)

If you prefer everything on Render in 1 single place:
1. Go to [**dashboard.render.com/blueprints**](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select your repository `smart-internship-monitoring`.
4. Render will read `render.yaml` and automatically create both the backend and frontend services!

---

## 🔑 Demo Logins on Deployed Site

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@demo.com` | `Student@123` |
| **Mentor** | `mentor@demo.com` | `Mentor@123` |
| **Admin** | `admin@demo.com` | `Admin@123` |

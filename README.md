# ai-resume-analyzer-job-match-platform

Deploy this stack as:
- `frontend` on Vercel
- `backend` on Render
- `ai-service` on Render

## 1) Deploy Backend + AI Service on Render

This repo includes `render.yaml` for Blueprint deploy.

1. Push latest code to GitHub.
2. In Render: `New` -> `Blueprint`.
3. Select this repository.
4. Render will create:
   - `ai-resume-scorer` (Python FastAPI)
   - `ai-resume-backend` (Node/Express)
5. Set env vars on `ai-resume-backend`:
   - `JWT_SECRET`
   - `MONGO_URI`
   - `GEMINI_API_KEY`
   - `AI_SERVICE_URL` = `https://<your-ai-resume-scorer>.onrender.com/analyze`
   - `CORS_ORIGIN` = `https://<your-vercel-domain>`

Health URLs:
- Backend: `https://<backend>.onrender.com/health`
- AI service: `https://<ai-service>.onrender.com/health`

## 2) Deploy Frontend on Vercel

1. In Vercel: `Add New Project`.
2. Import this GitHub repo.
3. Set `Root Directory` to `frontend`.
4. Set environment variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
5. Deploy.

`frontend/vercel.json` is included for SPA routing rewrite.

## 3) Local Environment Files

Examples are included:
- `backend/.env.example`
- `frontend/.env.example`

Copy to `.env` in each service for local development.

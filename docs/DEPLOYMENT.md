# InterviewIQ 2.0 — Production Deployment Guide

This guide details three production deployment pathways for InterviewIQ 2.0, ranging from 1-click cloud platforms to containerized VPS hosting.

---

## Architecture Overview

```
                          [DNS: interviewiq.ai]
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │     Nginx / Cloudflare CDN / Edge    │
                 └──────────┬────────────────┬──────────┘
                            │                │
     (Static Assets & SPA)  │                │  (API REST & WebSockets)
                            ▼                ▼
                ┌──────────────────┐   ┌────────────────────────┐
                │ Frontend Client  │   │  Backend API Gateway   │
                │ React 18 + Vite  │   │  Node.js + Express.js  │
                └──────────────────┘   └───────────┬────────────┘
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        ▼                          ▼                          ▼
             ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
             │    MongoDB Atlas    │    │ PostgreSQL Database │    │  Redis Cache / Queue│
             │   (Document Store)  │    │  (Credit Ledger)    │    │   (Rate Limiter)    │
             └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## Deployment Pathway 1: 1-Click Render Blueprint (`render.yaml`)

Render provides an Infrastructure-as-Code blueprint that orchestrates the API server and Redis Key Value store from the included `render.yaml`. Because Render limits accounts to one active free-tier PostgreSQL database, `render.yaml` reuses your existing PostgreSQL instance via `DATABASE_URL`.

### Steps:
1. Fork or push the repository to your GitHub account:
   `https://github.com/mtsssrinivas/AI-Powered-Adaptive-Interview-Assessment-Candidate-Intelligence-Platform`
2. Navigate to [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Blueprint**.
3. Select this repository. Render will automatically detect `render.yaml` and configure:
   - `interviewiq-api`: Node.js Web Service running `node server/dist/server.js` with healthcheck `/api/v1/health`
   - `interviewiq-redis`: Managed Key Value Redis store
4. Fill in the required environment variables when prompted:
   - `DATABASE_URL`: Connection string from your existing PostgreSQL database (e.g., from your Render dashboard, copy the *Internal Database URL* or *External Database URL*).
   - `MONGODB_URI`: Connection string from MongoDB Atlas (`mongodb+srv://...`).
   - `OPENROUTER_API_KEY`: Your OpenRouter API key (`sk-or-v1-...` or `mock`).
   - `CLIENT_URL`: Your frontend URL (e.g. `https://your-app.vercel.app`).
5. Click **Apply**. Render will build the shared workspace, compile the server, and start the API with automated healthcheck monitoring.

---

## Deployment Pathway 2: Containerized Docker Compose (VPS / Cloud VM)

For deployment on any Linux Virtual Private Server (AWS EC2, DigitalOcean Droplet, Hetzner, Linode):

### Prerequisites:
- Ubuntu 22.04+ LTS
- Docker 24.0+ and Docker Compose v2+ installed

### Steps:
```bash
# 1. Clone repository
git clone https://github.com/mtsssrinivas/AI-Powered-Adaptive-Interview-Assessment-Candidate-Intelligence-Platform.git
cd AI-Powered-Adaptive-Interview-Assessment-Candidate-Intelligence-Platform

# 2. Configure production environment
cp .env.production.example .env

# Edit .env with your production credentials
nano .env

# 3. Launch all 6 containers in detached mode
docker compose -f docker-compose.yml up --build -d

# 4. Check cluster health
docker compose ps
curl http://localhost:5000/api/v1/health
```

---

## Deployment Pathway 3: Vercel (Frontend) + Railway (Backend)

### 1. Deploy Backend to Railway:
- Go to [Railway.app](https://railway.app/).
- Click **New Project** ➔ **Deploy from GitHub repo**.
- Select this repository. Railway will detect `railway.json` and build the server.
- Add managed PostgreSQL and Redis plugins from the Railway dashboard.
- Set environment variables (`MONGODB_URI`, `OPENROUTER_API_KEY`, `JWT_SECRET`).
- Note the public backend domain generated (e.g. `https://interviewiq-production.up.railway.app`).

### 2. Deploy Frontend to Vercel:
- Go to [Vercel.com](https://vercel.com/).
- Import the repository.
- Root Directory: select `client` (or set Root Directory to `.` and Output Directory to `client/dist`).
- Framework Preset: **Vite**.
- Build Command: `npm run build:shared && npm run build:client`
- Environment Variables:
  - `VITE_API_BASE_URL`: Set to your Railway backend URL (e.g. `https://interviewiq-production.up.railway.app/api/v1`)
- Deploy.

---

## Production Environment Variables Checklist

| Variable | Description | Required | Example |
|:---|:---|:---:|:---|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | API server listen port | Yes | `5000` |
| `CLIENT_URL` | CORS authorized frontend origin | Yes | `https://interviewiq.ai` |
| `MONGODB_URI` | MongoDB connection URI | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/interviewiq` |
| `POSTGRES_URL` | PostgreSQL connection URI | Yes | `postgresql://user:pass@host:5432/interviewiq` |
| `REDIS_URL` | Redis connection URI | Yes | `redis://default:pass@host:6379` |
| `JWT_SECRET` | Cryptographically random 256-bit string | Yes | `min_32_characters_random_secret_here!` |
| `JWT_EXPIRES_IN` | Token validity duration | No | `7d` |
| `OPENROUTER_API_KEY` | OpenRouter API Key for LLM | Yes | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Default model identifier | No | `anthropic/claude-3.5-sonnet` |
| `RAZORPAY_KEY_ID` | Razorpay public key ID | Optional | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET`| Razorpay HMAC verification secret | Optional | `...` |

---

## Verifying Deployment

Once deployed, verify platform health using the automated diagnostic endpoints:

```bash
# 1. Verify subsystem connectivity (MongoDB, PostgreSQL, Redis, AI)
curl -s https://YOUR_API_DOMAIN/api/v1/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "subsystems": {
#     "mongodb": { "status": "up" },
#     "postgres": { "status": "up" },
#     "redis": { "status": "up" },
#     "aiProvider": { "status": "up" }
#   }
# }

# 2. Check Prometheus metrics
curl -s https://YOUR_API_DOMAIN/api/v1/metrics
```

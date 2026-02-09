# FleetSync Pro - Deployment Guide for Testing

> Quick guide to deploy FleetSync Pro for testing/demo purposes

---

## 🚀 Deployment Options

| Option | Best For | Cost | Difficulty |
|--------|----------|------|------------|
| **Docker Compose** | Local team testing | Free | ⭐ Easy |
| **Railway** | Quick cloud deployment | Free tier | ⭐ Easy |
| **Render** | Production-like testing | Free tier | ⭐⭐ Medium |
| **Vercel + Supabase** | Scalable testing | Free tier | ⭐⭐ Medium |

---

## Option 1: Docker Compose (Recommended for Local Testing)

### Prerequisites
- Docker Desktop installed
- Git

### Steps

```bash
# 1. Clone and navigate
cd "c:\project\FleetSync Pro"

# 2. Build and run everything
docker-compose up --build -d

# 3. Run database migrations
docker exec fleetsync-server npx prisma migrate deploy
docker exec fleetsync-server npx prisma db seed

# 4. Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Share with Team (ngrok)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5173
# Share the generated URL with testers
```

---

## Option 2: Railway (Easiest Cloud Deploy)

### Prerequisites
- GitHub account
- Railway account (https://railway.app)

### Steps

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial FleetSync Pro"
git remote add origin https://github.com/YOUR_USERNAME/fleetsync-pro.git
git push -u origin main
```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway auto-detects and creates:
     - PostgreSQL database
     - Node.js server
     - Vite frontend

3. **Configure Environment Variables**
```env
DATABASE_URL=<auto-provided by Railway>
JWT_SECRET=your-super-secret-jwt-key-12345
NODE_ENV=production
```

4. **Run Migrations**
   - Go to server service → Settings → Deploy → Custom Start Command:
   ```
   npx prisma migrate deploy && npx prisma db seed && npm start
   ```

---

## Option 3: Render

### Steps

1. **Create PostgreSQL Database**
   - Go to https://render.com
   - New → PostgreSQL
   - Copy the External Database URL

2. **Deploy Server**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Add env vars:
     ```
     DATABASE_URL=<your-postgres-url>
     JWT_SECRET=your-super-secret-jwt-key-12345
     ```

3. **Deploy Frontend**
   - New → Static Site
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add env var:
     ```
     VITE_API_URL=https://your-server.onrender.com
     ```

---

## Option 4: Vercel + Supabase

### Steps

1. **Create Supabase Database**
   - Go to https://supabase.com
   - New Project → Get connection string

2. **Update Client for Vercel**
   Create `client/vercel.json`:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```

3. **Deploy Frontend to Vercel**
   ```bash
   cd client
   npx vercel --prod
   ```

4. **Deploy Server to Railway/Render** (Vercel doesn't support Express)

---

## 📝 Environment Variables Reference

### Server (.env)
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/fleetsync?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"

# Server
PORT=3001
NODE_ENV=production
```

### Client (.env)
```env
VITE_API_URL=http://localhost:3001  # or your deployed server URL
```

---

## 🧪 Post-Deployment Testing Checklist

| Test | How to Verify |
|------|---------------|
| **Health Check** | `curl https://your-api.com/health` |
| **Login** | Use admin@fleetsync.com.au / admin123 |
| **Database** | Check if vehicles/drivers load on dashboard |
| **Create Rental** | Add a new rental assignment |
| **Compliance** | Check vehicle expiry warnings |

---

## 🔧 Quick Fixes

### Database Connection Issues
```bash
# Reset and reseed database
npx prisma migrate reset --force
```

### CORS Errors
Add to `server/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Build Failures
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Sharing Test Links

After deployment, share these with testers:

```
🌐 App URL: https://fleetsync-pro.vercel.app

📧 Test Accounts:
   Admin:  admin@fleetsync.com.au / admin123
   Driver: john.smith@email.com / driver123

📋 Test Data Doc: See TEST_DATA.md for scenarios
```

---

*Choose Railway for the fastest deployment, or Docker Compose for team testing!*

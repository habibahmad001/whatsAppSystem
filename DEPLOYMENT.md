# Deployment Guide

## 🏠 Local Development

For local development, the app will automatically use these defaults:
- **Host:** localhost
- **User:** root  
- **Password:** (empty)
- **Database:** mywhatsapp
- **Port:** 3306

No configuration needed! Just make sure MySQL is running locally.

## 🚀 Railway Deployment

### Step 1: Create Database
1. Go to your Railway project
2. Click "New Service" → "Database" → "MySQL"
3. Railway will create a MySQL database

### Step 2: Configure Environment Variables
1. Go to your main app service in Railway
2. Click "Variables" tab
3. Add these variables (use Railway's magic syntax):

```
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
DB_PORT=${{MYSQLPORT}}
```

### Step 3: Deploy
Railway will automatically deploy your app with the database connection.

## 🔧 How It Works

The app automatically detects which environment to use:

**Local Development:**
- Uses environment variables if set (`.env` file)
- Falls back to localhost defaults if no variables set

**Railway Production:**
- Uses Railway environment variables
- Connects to Railway MySQL database

## 📝 Environment Variables Reference

| Variable | Local Default | Railway Value | Description |
|----------|---------------|---------------|-------------|
| `DB_HOST` | `localhost` | `${{MYSQLHOST}}` | Database host |
| `DB_USER` | `root` | `${{MYSQLUSER}}` | Database user |
| `DB_PASSWORD` | `""` (empty) | `${{MYSQLPASSWORD}}` | Database password |
| `DB_NAME` | `mywhatsapp` | `${{MYSQLDATABASE}}` | Database name |
| `DB_PORT` | `3306` | `${{MYSQLPORT}}` | Database port |

## ✅ Testing

**Test locally:**
```bash
npm run dev
```

**Test on Railway:**
- Check logs for `[DB] Connected to: [hostname]`
- Should see tables created successfully
- API should work without database connection errors
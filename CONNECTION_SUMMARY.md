# 🔗 SUPABASE CONNECTION STRINGS SUMMARY

## 📍 Project Information
- **Project ID**: rqxhmhplxeiprzprobdb
- **Project Ref**: rqxhmhplxeiprzprobdb
- **Region**: us-east-1
- **Host**: db.rqxhmhplxeiprzprobdb.supabase.co

## 🚀 Vercel Production (Supabase)
### DATABASE_URL
```
postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
```

### DIRECT_URL
```
postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0
```

### Environment Variables for Vercel
```bash
DATABASE_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
DIRECT_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY_HERE@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0
NEXT_PUBLIC_SUPABASE_URL=https://rqxhmhplxeiprzprobdb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeGhtaHBseGVpcHJ6cHJvYmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4OTExOTksImV4cCI6MjA1OTQ2NzE5OX0.MlOAoNMyU7E_OSCTBZRFJTNzdZv4IZsY6_0xVT-v9KI
```

## 💻 Local Development (VPS)
### DATABASE_URL
```
postgresql://postgres:4v2zzMiIkC6IqBNkmsUENKd4JQUBSR8xi6oKenWcA3E0YS6THjKTWPwA1GuOUFTN@152.53.89.138:5435/postgres?sslmode=disable
```

### DIRECT_URL
```
postgresql://postgres:4v2zzMiIkC6IqBNkmsUENKd4JQUBSR8xi6oKenWcA3E0YS6THjKTWPwA1GuOUFTN@152.53.89.138:5435/postgres?sslmode=disable
```

## ⚠️ IMPORTANT NOTES

### For Vercel:
1. **Use DATABASE_URL** for Prisma operations
2. **Use DIRECT_URL** for migrations and direct connections
3. **Connection pooler** is automatically used
4. **SSL is enabled by default**

### For Local Development:
1. **Use VPS connection** for direct database access
2. **SSL is disabled** for local development
3. **Direct connection** for debugging and development

## 🔧 Configuration Steps

### 1. Update Vercel Environment Variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add the production DATABASE_URL and DIRECT_URL
3. Mark them for Production and Preview environments

### 2. Update Local Development:
1. Copy the local connection strings to your .env.local
2. Keep using your VPS for local development

### 3. Test Connections:
```bash
# Test production connection
pnpm test:connection:production

# Test local connection  
pnpm test:connection:local
```

## 🚨 Security Notes
- **Service Role Key**: Keep this secret and never expose in client-side code
- **Connection Pooling**: Vercel automatically uses Supabase's connection pooler
- **SSL**: Always enabled in production, can be disabled locally for development

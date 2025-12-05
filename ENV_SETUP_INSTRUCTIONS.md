# Environment Variables Setup

## 📝 Create .env Files

Since `.env` files are ignored by git, you need to create them manually.

### Step 1: Create Backend .env File

1. **Create file:** `backend/.env`
2. **Copy contents from:** `backend/.env.example`
3. **Or copy this:**

```env
# Supabase Configuration
SUPABASE_URL="https://fcrhcwvpivkadkkbxcom.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDgzNTMwNCwiZXhwIjoyMDgwNDExMzA0fQ.DBp9U20b6b6c8T4dave37j-Yn4pJtRNsZMyI5U6Am6s"
SUPABASE_JWT_SECRET="qacfE+SCAT8A/glw+tc7wK4G28laB7WiKK7wm6x1ZGkkOE0qyvyJKq/S3Rtd65Rus8i6NL57R/tC1TSUHA9FrQ=="

# PostgreSQL Connection Details
POSTGRES_DATABASE="postgres"
POSTGRES_HOST="db.fcrhcwvpivkadkkbxcom.supabase.co"
POSTGRES_PASSWORD="qMJ6kdKA7xL67suB"
POSTGRES_USER="postgres"

# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.fcrhcwvpivkadkkbxcom:qMJ6kdKA7xL67suB@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"

# Direct connection to the database (for migrations)
DIRECT_URL="postgresql://postgres.fcrhcwvpivkadkkbxcom:qMJ6kdKA7xL67suB@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
```

### Step 2: Create Frontend .env File

1. **Create file:** `.env` (in root directory)
2. **Copy contents from:** `.env.example`
3. **Or copy this:**

```env
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcmhjd3ZwaXZrYWRra2J4Y29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzUzMDQsImV4cCI6MjA4MDQxMTMwNH0.MjBw7_aVc2VlfND7Ec93sNOp352xcC0B8sZZvaH-Jkg"
EXPO_PUBLIC_SUPABASE_URL="https://fcrhcwvpivkadkkbxcom.supabase.co"
```

## ✅ Verify Setup

After creating the files, verify:

```bash
cd backend
npm run check:tables
```

## 🔑 Important Notes

1. **Password is already included:** The password `qMJ6kdKA7xL67suB` is already in the connection strings above
2. **Connection URLs:**
   - `DATABASE_URL` - For connection pooling (port 6543)
   - `DIRECT_URL` - For direct connections (port 5432)
3. **Both use the same password:** `qMJ6kdKA7xL67suB`

## 🚀 Next Steps

After creating `.env` files:

1. **Create tables in Supabase:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run: `supabase/migrations/000_create_tables_simple.sql`

2. **Seed the database:**
   ```bash
   cd backend
   npm run seed
   ```


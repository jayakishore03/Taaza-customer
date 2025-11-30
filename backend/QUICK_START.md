# Quick Start Guide - Backend Server

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` folder:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (for Expo)
CORS_ORIGIN=http://localhost:8081,http://localhost:19006
```

### How to Get Supabase Credentials:

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - **anon public key** → `SUPABASE_ANON_KEY`

## Step 3: Start the Server

```bash
# Development mode (auto-reload on changes)
npm run dev

# Production mode
npm start
```

## Step 4: Verify Server is Running

Open your browser or use curl:
```
http://localhost:3000/health
```

You should see:
```json
{
  "success": true,
  "message": "Taza API is running",
  "timestamp": "..."
}
```

## Step 5: Update Frontend

In your frontend `.env` file, add:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify `.env` file exists and has correct values
- Check console for error messages

### Database errors
- Make sure Supabase migration has been applied
- Verify Supabase credentials are correct
- Check Supabase project is active

### CORS errors
- Update `CORS_ORIGIN` in backend `.env`
- For mobile, use your computer's IP: `http://192.168.x.x:3000/api`

## API Endpoints

Once running, test these endpoints:

- Health: `GET http://localhost:3000/health`
- Products: `GET http://localhost:3000/api/products`
- Shops: `GET http://localhost:3000/api/shops`
- Orders: `GET http://localhost:3000/api/orders` (requires auth)

## Next Steps

1. Apply database migration in Supabase
2. Seed products (optional)
3. Start your Expo app
4. Test the connection!



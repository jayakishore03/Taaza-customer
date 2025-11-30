# Starting the Backend Server

## Quick Start

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not done):**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     SUPABASE_ANON_KEY=your_anon_key
     PORT=3000
     NODE_ENV=development
     CORS_ORIGIN=http://localhost:8081,http://localhost:19006
     ```

4. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

## Verify Server is Running

The server should start on `http://localhost:3000`

Test it:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Taza API is running",
  "timestamp": "..."
}
```

## API Endpoints

Once running, the API will be available at:
- Base URL: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`
- Products: `http://localhost:3000/api/products`
- Orders: `http://localhost:3000/api/orders` (requires auth)
- Users: `http://localhost:3000/api/users` (requires auth)
- Shops: `http://localhost:3000/api/shops`
- Coupons: `http://localhost:3000/api/coupons`
- Addons: `http://localhost:3000/api/addons`

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
1. Change `PORT` in `.env` file
2. Update `EXPO_PUBLIC_API_URL` in frontend `.env`

### Supabase Connection Error
- Verify your Supabase credentials in `.env`
- Make sure your Supabase project is active
- Check that the database migration has been applied

### CORS Errors
- Update `CORS_ORIGIN` in `.env` to include your frontend URL
- For mobile development, you may need to use your computer's IP address

## Next Steps

1. Make sure your Supabase database has the migration applied
2. Update frontend `.env` with `EXPO_PUBLIC_API_URL=http://localhost:3000/api`
3. Restart your Expo app to connect to the backend



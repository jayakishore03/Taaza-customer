# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```env
# Supabase Configuration (for authentication only)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## How to Get Backend API URL

- **Development**: `http://localhost:3000/api`
- **Production**: Your deployed backend URL (e.g., `https://your-backend.railway.app/api`)

## Important Notes

- The `.env` file should be in the **root directory** of your project
- After adding/changing `.env` variables, **restart your Expo dev server**
- Never commit `.env` to git (it's already in `.gitignore`)
- The app will show warnings if Supabase is not configured, but won't crash

## Troubleshooting

### Error: "supabaseUrl is required"

This means your environment variables are not set. 

**Solution:**
1. Create a `.env` file in the project root
2. Add the required variables (see above)
3. Restart Expo: `npx expo start --clear`

### Error: "Supabase is not configured"

The app will work but authentication won't function. Make sure:
1. `.env` file exists
2. Variables are prefixed with `EXPO_PUBLIC_`
3. No typos in variable names
4. Restarted Expo after adding variables


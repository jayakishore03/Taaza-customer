# Sign Up Error Fixed - Duplicate Email/Phone Handling

## Problem
Users were seeing a raw database error message when trying to sign up with an email or phone number that already exists:
```
Sign Up Failed
duplicate key value violates unique constraint "users_email_key"
```

## Solution Implemented

### 1. Backend Improvements (authController.js)

#### Added Email Duplicate Check
Before creating a user, the backend now checks for both:
- Duplicate phone numbers
- Duplicate email addresses

```javascript
// Check if user already exists (by phone)
const { data: existingUsersByPhone } = await supabase
  .from('users')
  .select('*')
  .eq('phone', phone);

if (existingUsersByPhone && existingUsersByPhone.length > 0) {
  return res.status(409).json({
    success: false,
    error: { message: 'An account with this phone number already exists. Please sign in instead.' },
  });
}

// Check if user already exists (by email)
if (email) {
  const { data: existingUsersByEmail } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  if (existingUsersByEmail && existingUsersByEmail.length > 0) {
    return res.status(409).json({
      success: false,
      error: { message: 'An account with this email already exists. Please sign in or use a different email.' },
    });
  }
}
```

#### Added Database Constraint Error Handling
As a safety net, we also handle PostgreSQL unique constraint violations:

```javascript
if (userError) {
  // Handle database constraint errors with user-friendly messages
  if (userError.code === '23505') { // PostgreSQL unique violation error code
    if (userError.message.includes('users_email_key')) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email already exists. Please sign in or use a different email.' },
      });
    }
    if (userError.message.includes('users_phone_key')) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this phone number already exists. Please sign in instead.' },
      });
    }
    return res.status(409).json({
      success: false,
      error: { message: 'An account with these details already exists.' },
    });
  }
  throw userError;
}
```

### 2. Frontend Already Handles Errors Properly

The frontend error handling chain is already good:
1. **API Client** (lib/api/client.ts) - Passes through error messages from backend
2. **Auth Context** (contexts/AuthContext.tsx) - Throws error with the message
3. **Sign Up Screen** (app/signup.tsx) - Displays error in Alert dialog

## User-Friendly Error Messages

Users will now see clear messages:

### For Duplicate Phone Number:
```
Sign Up Failed
An account with this phone number already exists. Please sign in instead.
```

### For Duplicate Email:
```
Sign Up Failed
An account with this email already exists. Please sign in or use a different email.
```

## Testing the Fix

### Test Scenario 1: Duplicate Phone Number
1. Sign up with a phone number that already exists in the database
2. Expected: User sees "An account with this phone number already exists. Please sign in instead."

### Test Scenario 2: Duplicate Email
1. Sign up with an email that already exists in the database
2. Expected: User sees "An account with this email already exists. Please sign in or use a different email."

### Test Scenario 3: New User
1. Sign up with unique phone number and email
2. Expected: Account created successfully, user redirected to profile

## Verifying the Backend is Running

Before testing, make sure your backend is running:

### Using Vercel (Production)
The app is already configured to use: `https://taaza-customer.vercel.app/api`
No local setup needed!

### Using Local Backend (Development)
```powershell
# In the backend directory
cd backend
node src/server.js
```

The backend should start on `http://localhost:3000`

Then update your `.env` file:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

Replace `YOUR_LOCAL_IP` with your computer's local IP address (use `ipconfig` to find it).

## Files Modified

1. `backend/src/controllers/authController.js`
   - Added duplicate email check
   - Added database constraint error handling with user-friendly messages

## Next Steps for Testing

1. **Test with Existing User:**
   - Try to sign up with phone: (use a phone number that exists)
   - You should see the user-friendly error message

2. **Test with New User:**
   - Use a unique phone number and email
   - Sign up should work perfectly

3. **Test the Sign In Link:**
   - When you see the error about duplicate phone/email
   - Click "Sign In" at the bottom
   - Try signing in with the existing credentials

## Backend Status Check

To verify your backend is working:

```powershell
# Test the backend health
curl https://taaza-customer.vercel.app/api/shops | ConvertFrom-Json
```

You should see a list of shops if the backend is working.

## Summary

✅ **Problem**: Raw database error shown to users  
✅ **Solution**: Added proper validation and user-friendly error messages  
✅ **Result**: Users now see clear, actionable error messages  

The error handling is now complete and user-friendly!



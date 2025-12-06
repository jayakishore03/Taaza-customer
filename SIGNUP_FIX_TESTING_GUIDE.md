# 🧪 Testing Guide - Sign Up Error Fix

## Pre-Testing Checklist

Before you start testing, ensure:

- [ ] Backend code changes are committed
- [ ] Code is pushed to GitHub
- [ ] Vercel has deployed the latest version
- [ ] App is running on your device/emulator
- [ ] You have test phone numbers and emails ready

---

## Test Case 1: Duplicate Email ✉️

### Setup
Find or create an existing user with email: `test@example.com`

### Steps
1. Open your app
2. Navigate to Sign Up screen
3. Fill in the form:
   - **Name:** Test User
   - **Phone:** `9999888877` (unique, not used)
   - **Email:** `test@example.com` (❗ already exists)
   - **Street:** 123 Main St
   - **City:** Mumbai
   - **State:** Maharashtra
   - **Postal Code:** 400001
   - **Gender:** Male
   - **Profile Icon:** Any
   - **Password:** test123
4. Verify phone with OTP
5. Accept terms and conditions
6. Tap **"Sign Up"** button

### Expected Result ✅
```
┌─────────────────────────────────────┐
│         Sign Up Failed              │
├─────────────────────────────────────┤
│                                     │
│  An account with this email         │
│  already exists. Please sign in     │
│  or use a different email.          │
│                                     │
│              [ OK ]                 │
└─────────────────────────────────────┘
```

### What to Check
- ✅ Error message is clear and in plain English
- ✅ No technical database jargon
- ✅ Message tells user what to do next
- ✅ User stays on sign up screen
- ✅ Can modify email and try again

### If You See Different Message ❌
- Backend might not be deployed yet
- Check Vercel deployment status
- Verify app is pointing to correct API URL

---

## Test Case 2: Duplicate Phone 📱

### Setup
Find or create an existing user with phone: `9876543210`

### Steps
1. Open your app
2. Navigate to Sign Up screen
3. Fill in the form:
   - **Name:** Another User
   - **Phone:** `9876543210` (❗ already exists)
   - **Email:** `unique@example.com` (unique, not used)
   - **Street:** 456 Oak Ave
   - **City:** Delhi
   - **State:** Delhi
   - **Postal Code:** 110001
   - **Gender:** Female
   - **Profile Icon:** Any
   - **Password:** test123
4. Try to send OTP
5. After OTP verification, accept terms
6. Tap **"Sign Up"** button

### Expected Result ✅
```
┌─────────────────────────────────────┐
│         Sign Up Failed              │
├─────────────────────────────────────┤
│                                     │
│  An account with this phone         │
│  number already exists.             │
│  Please sign in instead.            │
│                                     │
│              [ OK ]                 │
└─────────────────────────────────────┘
```

### What to Check
- ✅ Error message is clear and specific
- ✅ Suggests signing in instead
- ✅ User understands the issue immediately
- ✅ "Sign In" link at bottom is visible

### Follow-up Action
- Click "Sign In" link at bottom
- Should navigate to Sign In screen
- Try signing in with existing credentials

---

## Test Case 3: Both Duplicate (Phone + Email) 📧📱

### Setup
Use phone AND email that both exist:
- Phone: `9876543210` (exists)
- Email: `test@example.com` (exists)

### Steps
1. Open your app
2. Navigate to Sign Up screen
3. Fill in form with BOTH duplicate values
4. Complete OTP verification
5. Accept terms
6. Tap **"Sign Up"** button

### Expected Result ✅
Should show error for **phone first** (since phone is checked before email):
```
An account with this phone number already exists. 
Please sign in instead.
```

### Note
Backend checks phone first, then email. If phone is duplicate, it returns immediately without checking email.

---

## Test Case 4: Successful Sign Up ✨

### Setup
Prepare completely unique credentials:
- Phone: `8888777766` (never used before)
- Email: `newuser@example.com` (never used before)

### Steps
1. Open your app
2. Navigate to Sign Up screen
3. Fill in the form:
   - **Name:** New User
   - **Phone:** `8888777766` (unique)
   - **Email:** `newuser@example.com` (unique)
   - **Street:** 789 Elm Street
   - **City:** Bangalore
   - **State:** Karnataka
   - **Postal Code:** 560001
   - **Gender:** Male
   - **Profile Icon:** Any
   - **Password:** newpass123
4. Verify phone with OTP
5. Accept terms and conditions
6. Tap **"Sign Up"** button

### Expected Result ✅
```
┌─────────────────────────────────────┐
│       Account Created               │
├─────────────────────────────────────┤
│                                     │
│  You have signed up successfully.   │
│                                     │
│           [ Continue ]              │
└─────────────────────────────────────┘
```

Then:
- ✅ Automatically navigated to Profile screen
- ✅ User is logged in
- ✅ Profile shows correct name and details
- ✅ Default address is created

---

## Test Case 5: Missing Required Fields (Should Still Work) ✏️

### Steps
1. Open Sign Up screen
2. Leave Name field empty
3. Fill other fields
4. Tap "Sign Up"

### Expected Result ✅
```
┌─────────────────────────────────────┐
│       Missing Details               │
├─────────────────────────────────────┤
│                                     │
│  Please fill in all required        │
│  fields marked with *.              │
│                                     │
│              [ OK ]                 │
└─────────────────────────────────────┘
```

This confirms basic validation still works.

---

## Backend Verification

### Check if Backend is Running

```powershell
# Test backend health
curl https://taaza-customer.vercel.app/api/shops | ConvertFrom-Json
```

Should return shop data if backend is working.

### Check Vercel Deployment

1. Go to: https://vercel.com/dashboard
2. Find your project: `taaza-customer`
3. Check latest deployment:
   - ✅ Should show "Ready"
   - ✅ Should have your latest commit
   - ✅ Build logs should show no errors

### Check Backend Logs

```powershell
# If you have Vercel CLI installed
vercel logs taaza-customer
```

Look for sign-up attempts in logs.

---

## Database Verification

### Check Supabase

1. Go to your Supabase dashboard
2. Open **Table Editor**
3. Go to `users` table
4. Check existing entries:
   - Note which emails exist
   - Note which phone numbers exist
5. Use these for duplicate testing

### Query Database

```sql
-- Check if test email exists
SELECT * FROM users WHERE email = 'test@example.com';

-- Check if test phone exists
SELECT * FROM users WHERE phone = '9876543210';

-- Count total users
SELECT COUNT(*) FROM users;
```

---

## Troubleshooting

### Problem: Still Seeing Raw Database Error

**Possible Causes:**
1. Backend not deployed yet
2. App pointing to old API URL
3. Vercel deployment failed

**Solutions:**
```powershell
# 1. Check deployment status
vercel ls

# 2. Verify API URL in app
# Check: lib/api/client.ts
# Should be: https://taaza-customer.vercel.app/api

# 3. Force redeploy
cd backend
vercel --prod --force
```

### Problem: No Error Message at All

**Possible Causes:**
1. Frontend error handling issue
2. Network request failed
3. Backend returned unexpected format

**Solutions:**
1. Check browser/React Native debugger console
2. Look for network errors
3. Verify internet connection

### Problem: Error Message in Wrong Language

If you see technical errors, the fix might not be deployed:

```powershell
# Check what's deployed
git log -1 --oneline

# Check if pushed to remote
git status

# Push if needed
git push origin main
```

---

## Testing Checklist

Use this checklist while testing:

### Basic Functionality
- [ ] Can open Sign Up screen
- [ ] Can fill all form fields
- [ ] OTP verification works
- [ ] Terms checkbox works
- [ ] Sign Up button is clickable

### Error Handling
- [ ] Duplicate email shows friendly error
- [ ] Duplicate phone shows friendly error
- [ ] Missing fields show validation error
- [ ] Invalid email format is caught (if implemented)

### Success Flow
- [ ] New user can sign up successfully
- [ ] Success message appears
- [ ] Redirected to correct screen
- [ ] User is logged in automatically
- [ ] Profile data is saved correctly

### Edge Cases
- [ ] Empty email (if optional) - should work
- [ ] Very long name - should work or show error
- [ ] Special characters in name - should work
- [ ] International phone format - should work

---

## Test Results Template

Copy this and fill it out:

```markdown
## Sign Up Error Fix - Test Results

**Date:** _____________
**Tester:** _____________
**Device:** _____________
**Backend:** https://taaza-customer.vercel.app/api

### Test Case 1: Duplicate Email
- [ ] PASS / [ ] FAIL
- Error message: _____________________________
- Notes: _____________________________________

### Test Case 2: Duplicate Phone
- [ ] PASS / [ ] FAIL
- Error message: _____________________________
- Notes: _____________________________________

### Test Case 3: Successful Sign Up
- [ ] PASS / [ ] FAIL
- Redirected to: _____________________________
- Notes: _____________________________________

### Overall Assessment
- [ ] Fix working as expected
- [ ] Ready for production
- [ ] Issues found: ___________________________
```

---

## Success Criteria

The fix is successful if:

✅ **No raw database errors** appear to users  
✅ **All error messages** are in plain English  
✅ **Users understand** what went wrong  
✅ **Clear guidance** on what to do next  
✅ **New users** can still sign up successfully  

---

## Next Steps After Testing

1. ✅ **All tests pass?** → Mark as complete, celebrate! 🎉
2. ❌ **Some tests fail?** → Check troubleshooting section
3. 📝 **Found issues?** → Document and fix them
4. 🚀 **Everything works?** → Deploy to production!

---

**Happy Testing!** 🧪✨

Remember: Good error messages turn frustrated users into happy users!



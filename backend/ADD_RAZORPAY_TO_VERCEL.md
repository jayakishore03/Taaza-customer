# 🔐 Add Razorpay Credentials to Vercel

## 🎯 This is REQUIRED for payment to work!

Your backend is deployed on Vercel, so you **must** add the Razorpay credentials as environment variables on Vercel.

---

## ⚡ Quick Setup (5 minutes)

### **Step 1: Go to Vercel Dashboard**
1. Open: https://vercel.com
2. Sign in to your account
3. Click on your **backend project** (the API project)

### **Step 2: Open Environment Variables Settings**
1. Click **"Settings"** tab (top menu)
2. Click **"Environment Variables"** in the left sidebar

### **Step 3: Add Razorpay Credentials**

Add these **TWO** environment variables:

#### **Variable 1:**
```
Name:  RAZORPAY_KEY_ID
Value: rzp_test_RkgC2RZSP1gZNW
```

#### **Variable 2:**
```
Name:  RAZORPAY_KEY_SECRET
Value: ivWo5qTwct9dCsKlCG43NhCS
```

### **Step 4: Select Environment**
For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

(Check all three boxes!)

### **Step 5: Click "Save"**
Click the **"Save"** button for each variable.

### **Step 6: Redeploy**
After adding both variables:
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. Wait 1-2 minutes for deployment to complete

---

## 📸 Visual Guide

### **Finding Your Project:**
```
Vercel Dashboard
  └── Your Projects
        └── taza-backend (or similar name)
              └── Click this!
```

### **Navigating to Environment Variables:**
```
Project Dashboard
  └── Settings (top tab)
        └── Environment Variables (left sidebar)
              └── Add environment variable here
```

### **Adding a Variable:**
```
┌─────────────────────────────────────┐
│  Add Environment Variable           │
├─────────────────────────────────────┤
│  Name:                              │
│  ┌─────────────────────────────┐   │
│  │ RAZORPAY_KEY_ID             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Value:                             │
│  ┌─────────────────────────────┐   │
│  │ rzp_test_RkgC2RZSP1gZNW     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Environment:                       │
│  ☑ Production                       │
│  ☑ Preview                          │
│  ☑ Development                      │
│                                     │
│  [Save]                             │
└─────────────────────────────────────┘
```

---

## ✅ Verification Steps

### **1. Check Environment Variables are Added**
Go to: **Settings → Environment Variables**

You should see:
- ✅ `RAZORPAY_KEY_ID` = `rzp_test_RkgC2RZSP1gZNW`
- ✅ `RAZORPAY_KEY_SECRET` = `ivWo5qTwct9dCsKlCG43NhCS`

### **2. Check Deployment Status**
Go to: **Deployments** tab

You should see:
- ✅ Latest deployment is "Ready"
- ✅ Status shows green checkmark

### **3. Test Payment in App**
1. Open your app
2. Add items to cart
3. Go to checkout
4. Fill address
5. Click "Place Order"
6. Select **UPI** or **Card** (not COD)
7. Click "Pay Securely"
8. ✅ Should open Razorpay checkout (not show error)

---

## 🔍 Troubleshooting

### **Error: "Razorpay credentials not configured"**

**Solution:**
1. Check that both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are added
2. Check spelling is **exactly** correct (case-sensitive!)
3. Make sure you clicked "Save" for each variable
4. Redeploy the project after adding variables

### **Error: "Invalid key_id"**

**Solution:**
- Double-check the `RAZORPAY_KEY_ID` value
- Make sure it's: `rzp_test_RkgC2RZSP1gZNW`
- No extra spaces before or after

### **Error: "Authentication failed"**

**Solution:**
- Double-check the `RAZORPAY_KEY_SECRET` value
- Make sure it's: `ivWo5qTwct9dCsKlCG43NhCS`
- No extra spaces before or after

### **Payment modal doesn't open**

**Solution:**
1. Check browser console for errors
2. Verify environment variables on Vercel
3. Make sure you redeployed after adding variables
4. Wait 2-3 minutes for deployment to propagate

---

## 📋 Complete Checklist

Before testing payment:

- [ ] Logged into Vercel
- [ ] Found backend project
- [ ] Opened Settings → Environment Variables
- [ ] Added `RAZORPAY_KEY_ID`
- [ ] Added `RAZORPAY_KEY_SECRET`
- [ ] Selected all 3 environments for each
- [ ] Clicked Save for both
- [ ] Redeployed the project
- [ ] Waited 2-3 minutes
- [ ] Tested payment in app

---

## 🎯 Expected Result

After completing these steps:

✅ Payment endpoint will work  
✅ No "Razorpay credentials not configured" error  
✅ Razorpay checkout modal will open  
✅ You can test payments with Razorpay test cards  

---

## 💡 Test Cards (for testing)

Once Razorpay is configured, use these test cards:

**Successful Payment:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
```

**Failed Payment:**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVV: Any 3 digits
```

**UPI Test:**
```
UPI ID: success@razorpay
```

---

## 🚀 Quick Command Reference

If you want to test locally (not required for app):

```powershell
# In backend folder
.\setup-razorpay.ps1
```

This creates a local `.env` file for testing the backend on your computer.

---

## ⚠️ Important Notes

1. **These are TEST credentials** - They won't charge real money
2. **For production** - Replace with live Razorpay keys
3. **Keep credentials secret** - Don't share publicly
4. **Vercel deployment is most important** - The app uses your deployed backend

---

## 📞 Need Help?

If payment still doesn't work after following these steps:

1. Check Vercel deployment logs:
   - Go to Deployments → Click latest → View Function Logs
   - Look for "Razorpay" related errors

2. Check app error message:
   - Screenshot the exact error
   - Check Expo console for details

3. Verify environment variables:
   - Settings → Environment Variables
   - Confirm both variables are there
   - Confirm values match exactly

---

**Complete these steps and payment will work! 🎉**
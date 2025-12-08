# 🚀 Setting Up Razorpay on Vercel - Follow These Steps

## ⚡ Step-by-Step Guide (5 minutes)

---

### **STEP 1: Open Vercel** 🌐

1. Open your browser
2. Go to: **https://vercel.com**
3. Click **"Log In"** (top right)
4. Sign in with your account

✅ **You should now see your Vercel dashboard**

---

### **STEP 2: Find Your Backend Project** 📁

On the dashboard, you'll see your projects.

**Look for your BACKEND project** - it might be named:
- `taza-backend`
- `taaza-backend`
- `taza-api`
- Or similar

**Click on that project**

⚠️ **Important:** Make sure it's the **BACKEND** project (API), not the frontend/mobile app!

✅ **You should now see the project details page**

---

### **STEP 3: Open Settings** ⚙️

On the project page:

1. Look at the **top menu bar**
2. You'll see: Overview | Deployments | **Settings** | etc.
3. **Click "Settings"**

✅ **You should now see the Settings page with a left sidebar**

---

### **STEP 4: Open Environment Variables** 🔐

In the left sidebar, find and click:

**"Environment Variables"**

It's usually in the middle of the sidebar menu.

✅ **You should now see the Environment Variables page**
✅ **There's an "Add New" button at the top**

---

### **STEP 5: Add First Variable (Key ID)** 🔑

1. Click the **"Add New"** button

2. You'll see a form with:
   - **Name** field
   - **Value** field
   - **Environment** checkboxes

3. Fill in:

**Name (copy exactly):**
```
RAZORPAY_KEY_ID
```

**Value (copy exactly):**
```
rzp_test_RkgC2RZSP1gZNW
```

4. Under **"Select Environments"**, check **ALL THREE** boxes:
   - ☑️ **Production**
   - ☑️ **Preview**
   - ☑️ **Development**

5. Click **"Save"** button

✅ **You should see the variable added to the list**
✅ **It shows "RAZORPAY_KEY_ID" in the list**

---

### **STEP 6: Add Second Variable (Key Secret)** 🔐

1. Click **"Add New"** button again

2. Fill in:

**Name (copy exactly):**
```
RAZORPAY_KEY_SECRET
```

**Value (copy exactly):**
```
ivWo5qTwct9dCsKlCG43NhCS
```

3. Check **ALL THREE** environment boxes:
   - ☑️ **Production**
   - ☑️ **Preview**
   - ☑️ **Development**

4. Click **"Save"** button

✅ **You should see both variables in the list now:**
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET

---

### **STEP 7: Redeploy the Project** 🔄

Now we need to redeploy so the changes take effect:

1. Click **"Deployments"** tab (top menu)

2. You'll see a list of deployments

3. Click on the **FIRST/LATEST** deployment (the one at the top)

4. On the deployment page, look for a button with three dots **"..."** or a **"Redeploy"** button

5. Click **"Redeploy"**

6. A confirmation dialog appears - Click **"Redeploy"** again to confirm

✅ **You should see:**
- "Building..." status
- Then "Ready" with a green checkmark (takes 2-3 minutes)

---

### **STEP 8: Wait for Deployment** ⏱️

**Important:** Wait 2-3 minutes for the deployment to complete.

You'll know it's ready when:
- ✅ Status changes to "Ready"
- ✅ Green checkmark appears
- ✅ No "Building" or "Queued" status

---

### **STEP 9: Test in Your App** 📱

Now test the payment:

1. **Open your app** (force quit and reopen if it was running)

2. **Add items to cart**

3. **Go to checkout**

4. **Fill in delivery address**

5. **Click "Place Order"**

6. **On payment page, select UPI or Card** (not COD)

7. **Click "Pay Securely"**

✅ **Expected Result:**
- Razorpay payment modal should open
- No more "credentials not configured" error
- You can enter test card details

---

## 🧪 Test Payment

Use these test credentials:

**Test Card (Success):**
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
Name: Test User
```

**Test UPI:**
```
UPI ID: success@razorpay
```

---

## ✅ Verification Checklist

Go through this checklist:

**In Vercel:**
- [ ] Logged into Vercel
- [ ] Found backend project
- [ ] Opened Settings → Environment Variables
- [ ] Added RAZORPAY_KEY_ID
- [ ] Added RAZORPAY_KEY_SECRET
- [ ] Both have all 3 environments checked
- [ ] Both are saved (visible in the list)
- [ ] Went to Deployments tab
- [ ] Redeployed the project
- [ ] Deployment status shows "Ready"
- [ ] Waited 2-3 minutes

**In App:**
- [ ] Force quit and reopened app
- [ ] Added items to cart
- [ ] Filled address at checkout
- [ ] Clicked "Place Order"
- [ ] Selected UPI/Card payment
- [ ] Clicked "Pay Securely"
- [ ] Razorpay modal opened (no error)

---

## 🚨 Troubleshooting

### **"I can't find my backend project on Vercel"**

**Solution:**
1. Check if you've deployed the backend to Vercel
2. Look for project with "backend" or "api" in the name
3. Check the project URL - it should be an API endpoint
4. If not found, you may need to deploy backend first

---

### **"I added the variables but still getting error"**

**Checklist:**
- [ ] Did you add BOTH variables?
- [ ] Did you check all 3 environments for each?
- [ ] Did you click "Save" for each variable?
- [ ] Did you click "Redeploy" after adding them?
- [ ] Did you wait 2-3 minutes after redeploying?
- [ ] Did you force quit and reopen the app?

---

### **"Where is the Redeploy button?"**

**Steps:**
1. Go to "Deployments" tab
2. Click on the TOP deployment (latest one)
3. Look for:
   - A "..." menu button (three dots) → Click → "Redeploy"
   - OR a direct "Redeploy" button
4. Click it and confirm

---

### **"Deployment is stuck on Building"**

**Solution:**
- This is normal, wait 2-3 minutes
- If it takes longer than 5 minutes, refresh the page
- Check for any error messages in the build logs

---

### **"Still showing credentials not configured after setup"**

**Solution:**
1. Go back to Settings → Environment Variables
2. Verify both variables are there:
   - RAZORPAY_KEY_ID = rzp_test_RkgC2RZSP1gZNW
   - RAZORPAY_KEY_SECRET = ivWo5qTwct9dCsKlCG43NhCS
3. Check spelling (it's case-sensitive!)
4. Make sure no extra spaces in values
5. Redeploy again
6. Wait 3 minutes
7. Force quit app completely
8. Reopen and test

---

## 📸 What You Should See

### **In Vercel Environment Variables:**
```
┌────────────────────────────────────────┐
│ Environment Variables                   │
├────────────────────────────────────────┤
│                                         │
│ RAZORPAY_KEY_ID                        │
│ rzp_test_Rkg...  [Production] [+2]    │
│ Added: Just now                         │
│                                         │
│ RAZORPAY_KEY_SECRET                    │
│ ivWo5qTwct...    [Production] [+2]    │
│ Added: Just now                         │
│                                         │
└────────────────────────────────────────┘
```

### **In Deployments:**
```
┌────────────────────────────────────────┐
│ Production Deployments                  │
├────────────────────────────────────────┤
│                                         │
│ ✅ Ready        main      2m ago       │
│    https://your-api.vercel.app         │
│                                         │
└────────────────────────────────────────┘
```

---

## 🎉 Success Looks Like

When everything is working:

1. ✅ No error when clicking "Pay Securely"
2. ✅ Razorpay checkout modal opens
3. ✅ Can enter test card details
4. ✅ Payment processes successfully
5. ✅ Order is created and visible in Orders page

---

## 💡 Quick Tips

- **Copy-paste the values** - Don't type them manually (avoid typos)
- **Check all 3 environments** - Very important!
- **Wait after redeploying** - Changes take 2-3 minutes to propagate
- **Force quit the app** - Make sure it picks up the new backend changes

---

**🚀 Follow these steps and payment will work! Take your time with each step.**

**Need help? Tell me which step you're on and I'll guide you!**


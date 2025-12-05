# 🚀 API-Based Data Migration (EASIEST METHOD!)

## ✅ What I Just Created For You:

1. **API Endpoint** - Loads data from JSON to database
2. **Web Interface** - Simple button to click
3. **No SQL needed** - Everything automated!

---

## 🎯 Method 1: Use the Web Interface (EASIEST!)

### Step 1: Start Backend
```powershell
npm run dev
```

### Step 2: Open the HTML file
```powershell
start LOAD_DATA.html
```

### Step 3: Click the Button!
- You'll see a nice web page
- Click **"Load Data to Database"**
- Wait 5-10 seconds
- Done! ✅

---

## 🎯 Method 2: Use Browser Directly

### Step 1: Start Backend
```powershell
npm run dev
```

### Step 2: Check Current Status
Open in browser:
```
http://localhost:3000/api/migrate/status
```

You'll see how many records are in each table.

### Step 3: Load All Data
Open in browser:
```
http://localhost:3000/api/migrate/all
```

*(This is a POST request, so better to use the HTML interface or Postman)*

---

## 🎯 Method 3: Use PowerShell/cURL

### Load all data:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/migrate/all" -Method POST
```

### Check status:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/migrate/status" -Method GET
```

---

## 📊 What Gets Loaded:

- ✅ **3 Shops** - Fresh Farm Meats, City Chicken Center, Mutton & More
- ✅ **56 Products** - All chicken, mutton, pork items
- ✅ **2 Add-ons** - Spice Mix, Marination Pack
- ✅ **2 Coupons** - SAVE10, DISCOUNT15

**Total: 63 records**

---

## 🔄 Important: No Duplicates!

The endpoint uses `UPSERT` which means:
- ✅ If record exists → Updates it
- ✅ If record doesn't exist → Creates it
- ✅ Safe to run multiple times
- ✅ No duplicate data

---

## ⚠️ IMPORTANT: Tables Must Exist First!

Before using the API endpoint, you MUST create the tables in Supabase.

**One-time setup in Supabase:**
1. Go to: https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom/sql/new
2. Run this command to copy SQL:
   ```powershell
   Get-Content COMPLETE_MIGRATION.sql | Set-Clipboard
   ```
3. Paste in Supabase SQL Editor (Ctrl+V)
4. Click RUN
5. Wait for success message

**Then use the API endpoint to load data!**

---

## 🎉 Quick Start (Do This Now!)

```powershell
# 1. Start backend
npm run dev

# 2. Open the web interface
start LOAD_DATA.html

# 3. Click the button!
```

That's it! Your data will be loaded! 🚀

---

## 🔍 API Response Example

**Success Response:**
```json
{
  "success": true,
  "message": "All data migrated successfully!",
  "totalRecords": 63,
  "results": {
    "shops": { "success": true, "count": 3 },
    "products": { "success": true, "count": 56 },
    "addons": { "success": true, "count": 2 },
    "coupons": { "success": true, "count": 2 }
  }
}
```

---

## ✅ After Data is Loaded:

**Test your APIs:**
- Products: http://localhost:3000/api/products
- Shops: http://localhost:3000/api/shops
- Addons: http://localhost:3000/api/addons
- Coupons: http://localhost:3000/api/coupons

**Verify in Supabase Dashboard:**
- Go to Table Editor
- Click on tables to see your data!

---

## 🆘 Troubleshooting:

### "Cannot connect to server"
- Make sure backend is running: `npm run dev`
- Check if server is on port 3000

### "Table does not exist"
- You need to create tables first in Supabase
- See "IMPORTANT: Tables Must Exist First!" section above

### "CORS error"
- Make sure you opened `LOAD_DATA.html` (not just viewing the file)
- Or use `start LOAD_DATA.html` to open properly

---

**This is the EASIEST way to migrate your data!** 🎉


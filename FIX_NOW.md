# 🔧 IMMEDIATE FIX - Follow These Steps

## ✅ Step 1: IP Address Fixed
- Updated from `192.168.0.5` to `192.168.0.2` (your actual IP)
- Created `.env` file with correct IP

## ⚠️ Step 2: Add Firewall Rule (REQUIRED - Run as Administrator)

**Right-click PowerShell → "Run as Administrator", then:**

```powershell
cd C:\Users\DELL\Desktop\taza-1\backend
.\allow-firewall.ps1
```

**OR run this command directly:**
```powershell
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
```

## ✅ Step 3: Restart Expo (Clear Cache)

```bash
npx expo start --clear
```

## ✅ Step 4: Verify Backend is Running

The server should already be running. Check terminal for:
```
🚀 Taza Backend API running on port 3000
```

## 🧪 Step 5: Test Connection

After firewall is fixed, test in your phone's browser:
- Open: `http://192.168.0.2:3000/health`
- Should see: `{"success":true,"message":"Taza API is running"}`

## 📱 For Android Emulator

If using Android Emulator, update `.env` to:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

Then restart Expo with `--clear`.

---

**The main issue was the wrong IP address (0.5 vs 0.2). Now you just need to allow firewall access!**


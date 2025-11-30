# Setting Up Mobile Device Connection

## Problem
When testing on a **real Android/iOS device** or **emulator**, `localhost` doesn't work because it refers to the device itself, not your development computer.

## Solution

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).
Example: `192.168.0.5`

**Mac/Linux:**
```bash
ifconfig
```
Look for `inet` address under `en0` or `wlan0`.

### Step 2: Create/Update `.env` File

Create a `.env` file in the **root directory** of your project:

```env
# Backend API URL - Use your computer's IP address for mobile devices
EXPO_PUBLIC_API_URL=http://192.168.0.5:3000/api

# For Android Emulator, use:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For iOS Simulator, use:
# EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Replace `192.168.0.5` with your actual IP address!**

### Step 3: Restart Expo

**IMPORTANT:** You must restart Expo with cleared cache for environment variables to take effect:

```bash
npx expo start --clear
```

### Step 4: Verify Backend is Running

Make sure your backend server is running:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Taza Backend API running on port 3000
```

### Step 5: Test Connection

1. Open the app on your device
2. The shops should load without errors
3. If you still see "Network request failed":
   - Verify both your computer and phone are on the **same Wi-Fi network**
   - Check Windows Firewall allows port 3000
   - Try accessing `http://YOUR_IP:3000/health` in your phone's browser

## Quick Fix Checklist

- [ ] Found your computer's IP address
- [ ] Created `.env` file with `EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api`
- [ ] Restarted Expo with `npx expo start --clear`
- [ ] Backend is running on port 3000
- [ ] Computer and phone on same Wi-Fi network
- [ ] Firewall allows port 3000

## Troubleshooting

### Still getting "Network request failed"?

1. **Check IP address is correct:**
   ```bash
   # Windows
   ipconfig
   
   # Test from phone browser
   http://YOUR_IP:3000/health
   ```

2. **Check firewall:**
   - Windows: Allow Node.js through firewall
   - Or temporarily disable firewall to test

3. **Check network:**
   - Both devices must be on same Wi-Fi
   - Some corporate/public networks block device-to-device communication

4. **Try different IP:**
   - If you have multiple network adapters, try the other IP address
   - Check both IPv4 addresses from `ipconfig`

### For Android Emulator

Use `10.0.2.2` instead of your IP:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

### For iOS Simulator

`localhost` works fine:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```


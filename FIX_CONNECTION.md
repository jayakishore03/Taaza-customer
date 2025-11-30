# Fix Backend Connection Issues

## Quick Fix Steps

### 1. Allow Firewall Access (REQUIRED)

**Run PowerShell as Administrator:**
```powershell
cd backend
.\allow-firewall.ps1
```

Or manually:
```powershell
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
```

### 2. Verify Backend is Running

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Taza Backend API running on port 3000
📱 Mobile access: http://192.168.0.5:3000/api
```

### 3. Check Your IP Address

```bash
ipconfig
```

Look for "IPv4 Address" (usually under Wi-Fi or Ethernet adapter).

### 4. Create/Update .env File

Create `.env` in the **root directory**:

```env
# For physical Android/iOS device (use your actual IP from ipconfig)
EXPO_PUBLIC_API_URL=http://192.168.0.5:3000/api

# For Android Emulator (use this instead)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For iOS Simulator (use this instead)
# EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 5. Restart Expo with Clear Cache

```bash
npx expo start --clear
```

## Verify Connection

1. Open app on your device
2. Check if shops/products load
3. If still failing, test in phone browser: `http://YOUR_IP:3000/health`

## Common Issues

- **Firewall blocking**: Run `allow-firewall.ps1` as Administrator
- **Wrong IP**: Check with `ipconfig` and update `.env`
- **Different networks**: Ensure phone and computer on same Wi-Fi
- **Android emulator**: Must use `10.0.2.2` instead of your IP


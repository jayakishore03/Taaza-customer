# Run this script as Administrator to allow Node.js server on port 3000
# Right-click PowerShell and select "Run as Administrator", then run: .\allow-firewall.ps1

Write-Host "Adding firewall rule for Node.js server on port 3000..." -ForegroundColor Yellow

try {
    netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host "The server should now be accessible from mobile devices on your network." -ForegroundColor Green
} catch {
    Write-Host "❌ Error adding firewall rule: $_" -ForegroundColor Red
    Write-Host "Make sure you're running PowerShell as Administrator." -ForegroundColor Yellow
}


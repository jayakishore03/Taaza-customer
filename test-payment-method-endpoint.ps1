# Test Payment Method API Endpoint
# This script tests the payment method creation endpoint on Vercel

Write-Host "Testing Payment Method API Endpoint..." -ForegroundColor Cyan
Write-Host ""

$VERCEL_API = "https://taaza-customer.vercel.app/api"

# First, check if backend is responding
Write-Host "1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://taaza-customer.vercel.app/health" -Method GET -ErrorAction Stop
    Write-Host "   Backend is responding!" -ForegroundColor Green
    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   Backend health check failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   This means Vercel deployment might not be complete yet." -ForegroundColor Yellow
    Write-Host "   Wait 2-3 minutes and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Note: We cannot test the actual payment method creation without authentication
# But we can test if the endpoint exists
Write-Host "2. Checking Payment Methods Endpoint..." -ForegroundColor Yellow
try {
    # This will return 401 which is expected without auth token
    # But it confirms the endpoint exists and the backend is deployed
    Invoke-RestMethod -Uri "$VERCEL_API/payment-methods" -Method GET -ErrorAction Stop
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Host "   Payment Methods endpoint exists!" -ForegroundColor Green
        Write-Host "   (401 Unauthorized is expected without auth token)" -ForegroundColor Gray
    } elseif ($statusCode -eq 404) {
        Write-Host "   Payment Methods endpoint not found (404)" -ForegroundColor Red
        Write-Host "   Vercel deployment may not include the latest backend code" -ForegroundColor Red
    } else {
        Write-Host "   Unexpected response: HTTP $statusCode" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Backend URL: $VERCEL_API" -ForegroundColor White
Write-Host "  If you see 401 errors in your app, the backend is working" -ForegroundColor White
Write-Host "  If you see Failed to create payment method, check:" -ForegroundColor White
Write-Host "    1. Vercel deployment completed at https://vercel.com" -ForegroundColor White
Write-Host "    2. Latest commit is deployed" -ForegroundColor White
Write-Host "    3. Check Vercel function logs for detailed errors" -ForegroundColor White
Write-Host ""

# Check Git status
Write-Host "3. Checking Git Status..." -ForegroundColor Yellow
$latestCommit = git log -1 --oneline
Write-Host "   Latest commit: $latestCommit" -ForegroundColor Gray
Write-Host ""
Write-Host "   Go to https://vercel.com and check Deployments tab" -ForegroundColor White
Write-Host "   Verify this commit is deployed with Ready status" -ForegroundColor White
Write-Host ""

# Run this script AFTER you click RUN in Supabase SQL Editor

Write-Host ""
Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Verifying and Loading Data...          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if tables exist
Write-Host "Step 1: Checking if tables exist..." -ForegroundColor Yellow
$status = Invoke-RestMethod -Uri "http://localhost:3000/api/migrate/status"

if ($status.allTablesExist) {
    Write-Host "✅ All tables exist!" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Load data
    Write-Host "Step 2: Loading data from JSON files..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/migrate/all" -Method POST -UseBasicParsing
        $result = $response.Content | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║  MIGRATION COMPLETE!                     ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📊 Results:" -ForegroundColor Cyan
        Write-Host "  🏪 Shops:    $($result.results.shops.count) migrated" -ForegroundColor White
        Write-Host "  🥩 Products: $($result.results.products.count) migrated" -ForegroundColor White
        Write-Host "  ➕ Addons:   $($result.results.addons.count) migrated" -ForegroundColor White
        Write-Host "  🎫 Coupons:  $($result.results.coupons.count) migrated" -ForegroundColor White
        Write-Host ""
        Write-Host "  📦 Total: $($result.totalRecords) records" -ForegroundColor Yellow
        Write-Host ""
        
        if ($result.success) {
            Write-Host "✅ All data loaded successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Your database is ready!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Test your APIs:" -ForegroundColor Cyan
            Write-Host "  http://localhost:3000/api/products" -ForegroundColor Gray
            Write-Host "  http://localhost:3000/api/shops" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host "⚠️ Some migrations had issues:" -ForegroundColor Yellow
            Write-Host ""
            if ($result.results.shops.error) { Write-Host "  Shops: $($result.results.shops.error)" -ForegroundColor Red }
            if ($result.results.products.error) { Write-Host "  Products: $($result.results.products.error)" -ForegroundColor Red }
            if ($result.results.addons.error) { Write-Host "  Addons: $($result.results.addons.error)" -ForegroundColor Red }
            if ($result.results.coupons.error) { Write-Host "  Coupons: $($result.results.coupons.error)" -ForegroundColor Red }
            Write-Host ""
        }
    }
    catch {
        Write-Host "❌ Error during migration:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }
}
else {
    Write-Host "❌ Tables don't exist yet!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Go to Supabase SQL Editor" -ForegroundColor White
    Write-Host "2. Paste the SQL (it's in your clipboard)" -ForegroundColor White
    Write-Host "3. Click RUN" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


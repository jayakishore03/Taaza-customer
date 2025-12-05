# PowerShell Script to Open Migration SQL File
# This script will:
# 1. Read the migration SQL file
# 2. Copy it to clipboard
# 3. Open Supabase dashboard in browser

Write-Host "*** Taza App - Database Migration Helper ***" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the SQL file path
$sqlFile = Join-Path $PSScriptRoot "..\supabase\migrations\000_create_tables_simple.sql"

# Check if file exists
if (Test-Path $sqlFile) {
    Write-Host "[OK] Found migration file: 000_create_tables_simple.sql" -ForegroundColor Green
    Write-Host ""
    
    # Read the SQL content
    $sqlContent = Get-Content $sqlFile -Raw
    
    # Copy to clipboard
    try {
        $sqlContent | Set-Clipboard
        Write-Host "[OK] SQL copied to clipboard!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[WARN] Could not copy to clipboard" -ForegroundColor Yellow
        Write-Host "       You'll need to manually copy from the file" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Show instructions
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Opening Supabase Dashboard in your browser..." -ForegroundColor White
    Write-Host "   2. Click 'SQL Editor' in the left sidebar" -ForegroundColor White
    Write-Host "   3. Click 'New query'" -ForegroundColor White
    Write-Host "   4. Press Ctrl+V to paste the SQL" -ForegroundColor White
    Write-Host "   5. Click 'Run' or press Ctrl+Enter" -ForegroundColor White
    Write-Host "   6. Wait for success message" -ForegroundColor White
    Write-Host "   7. Come back here and run: npm run seed" -ForegroundColor White
    Write-Host ""
    
    # Open Supabase dashboard
    Start-Sleep -Seconds 2
    Start-Process "https://supabase.com/dashboard/project/fcrhcwvpivkadkkbxcom/editor"
    
    Write-Host "[OK] Browser opened!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[TIP] SQL is in your clipboard - just paste it in Supabase SQL Editor!" -ForegroundColor Yellow
    Write-Host ""
    
    # Show file location
    Write-Host "SQL File Location:" -ForegroundColor Cyan
    Write-Host "   $sqlFile" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "[ERROR] Migration file not found!" -ForegroundColor Red
    Write-Host "        Expected: $sqlFile" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


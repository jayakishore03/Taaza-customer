# Deploy Payment Method Fix to Vercel
# This script commits and pushes the backend fix to trigger automatic Vercel deployment

Write-Host "🔧 Deploying Payment Method Fix..." -ForegroundColor Cyan
Write-Host ""

# Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No changes to commit. Backend fix may already be deployed." -ForegroundColor Green
    Write-Host ""
    Write-Host "To manually redeploy on Vercel:" -ForegroundColor Yellow
    Write-Host "1. Go to https://vercel.com" -ForegroundColor Yellow
    Write-Host "2. Click on your backend project" -ForegroundColor Yellow
    Write-Host "3. Go to Deployments tab" -ForegroundColor Yellow
    Write-Host "4. Click 'Redeploy' on the latest deployment" -ForegroundColor Yellow
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Stage the backend changes
Write-Host "📦 Staging backend controller fix..." -ForegroundColor Cyan
git add backend/src/controllers/paymentMethodsController.js

# Stage frontend API fix
Write-Host "📦 Staging frontend API fix..." -ForegroundColor Cyan
git add lib/api/paymentMethods.ts

# Stage documentation
Write-Host "📦 Staging documentation..." -ForegroundColor Cyan
git add PAYMENT_METHOD_ERROR_FIXED.md

Write-Host ""

# Commit the changes
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m "Fix payment method creation error

- Fixed frontend API response handling in paymentMethods.ts
- Fixed backend UUID type mismatch in paymentMethodsController.js
- Database now auto-generates UUID for payment method IDs
- Resolves 'Failed to create payment method' error"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Changes committed successfully!" -ForegroundColor Green
Write-Host ""

# Push to trigger Vercel deployment
Write-Host "🚀 Pushing to remote repository..." -ForegroundColor Cyan
Write-Host "   This will trigger automatic Vercel deployment..." -ForegroundColor Yellow
Write-Host ""

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to push changes" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 You may need to pull first if your local branch is behind:" -ForegroundColor Yellow
    Write-Host "   git pull origin main" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Vercel Deployment Status:" -ForegroundColor Cyan
Write-Host "   - Vercel is now automatically deploying your backend" -ForegroundColor Yellow
Write-Host "   - This usually takes 1-2 minutes" -ForegroundColor Yellow
Write-Host "   - You can monitor progress at: https://vercel.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait 2-3 minutes for Vercel deployment to complete" -ForegroundColor White
Write-Host "   2. Restart your app: npx expo start --clear" -ForegroundColor White
Write-Host "   3. Test adding a payment method" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Deployment initiated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For detailed information, see: PAYMENT_METHOD_ERROR_FIXED.md" -ForegroundColor Cyan
Write-Host ""


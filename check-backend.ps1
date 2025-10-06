# PowerShell script to check if the backend compiles without errors

Write-Host "Checking NexoPOS Backend Compilation..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

Write-Host "1. Checking TypeScript compilation..." -ForegroundColor Yellow
$result = npx tsc --noEmit 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS: Backend compiles without errors!" -ForegroundColor Green
    Write-Host ""
    Write-Host "2. Running the test script..." -ForegroundColor Yellow
    node test-inventory-calc.js
} else {
    Write-Host ""
    Write-Host "❌ ERROR: TypeScript compilation failed" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Compilation check completed" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

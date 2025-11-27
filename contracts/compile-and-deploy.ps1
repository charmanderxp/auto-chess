# PowerShell script to compile and deploy AutoChessPrivate
Set-Location $PSScriptRoot

Write-Host "Compiling contracts..." -ForegroundColor Green
npx hardhat compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation successful!" -ForegroundColor Green
    Write-Host "Deploying to Hardhat network..." -ForegroundColor Green
    npx hardhat run scripts/deploy.ts --network hardhat
} else {
    Write-Host "Compilation failed!" -ForegroundColor Red
    exit 1
}


$ErrorActionPreference = "Stop"

$ACCOUNT = "091653536932"
$REGION = "us-east-1"
$BACKEND_REPO = "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/backend"
$FRONTEND_REPO = "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/frontend"

Write-Host "=== Logging in to ECR ===" -ForegroundColor Cyan
$token = aws ecr get-login-password --region $REGION
$token | Out-File -FilePath "$env:TEMP\ecr_token.txt" -Encoding ascii -NoNewline
cmd /c "docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com < %TEMP%\ecr_token.txt"
Remove-Item "$env:TEMP\ecr_token.txt" -ErrorAction SilentlyContinue
Write-Host "Login successful" -ForegroundColor Green

Write-Host "=== Building backend ===" -ForegroundColor Cyan
$env:DOCKER_BUILDKIT = "0"
docker build -f backend/Dockerfile -t "${BACKEND_REPO}:latest" .
Write-Host "Backend build done" -ForegroundColor Green

Write-Host "=== Pushing backend ===" -ForegroundColor Cyan
$pushed = $false
for ($i = 1; $i -le 5; $i++) {
    docker push "${BACKEND_REPO}:latest"
    if ($LASTEXITCODE -eq 0) { $pushed = $true; break }
    Write-Host "Push attempt $i failed, retrying in 15s..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}
if (-not $pushed) { Write-Host "ERROR: Backend push failed after 5 attempts" -ForegroundColor Red; exit 1 }
Write-Host "Backend push done" -ForegroundColor Green

Write-Host "=== Building frontend ===" -ForegroundColor Cyan
$env:DOCKER_BUILDKIT = "0"
docker build -f frontend/Dockerfile.production -t "${FRONTEND_REPO}:latest" .
Write-Host "Frontend build done" -ForegroundColor Green

Write-Host "=== Pushing frontend ===" -ForegroundColor Cyan
docker push "${FRONTEND_REPO}:latest"
Write-Host "Frontend push done" -ForegroundColor Green

Write-Host "=== Forcing ECS redeployment ===" -ForegroundColor Cyan
aws ecs update-service --cluster iluase-prod --service iluase-backend --force-new-deployment --region $REGION --output text --query "service.serviceName"
aws ecs update-service --cluster iluase-prod --service iluase-frontend --force-new-deployment --region $REGION --output text --query "service.serviceName"

Write-Host "=== DONE - ECS is deploying new tasks ===" -ForegroundColor Green

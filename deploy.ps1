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

Write-Host "=== Updating ECS task definitions to :latest ===" -ForegroundColor Cyan

# Backend: register new task def revision pointing to :latest
$tdBackend = aws ecs describe-task-definition --task-definition iluase-prod-backend --query "taskDefinition" | ConvertFrom-Json
$tdBackend.containerDefinitions[0].image = "${BACKEND_REPO}:latest"
$backendParams = @{
    family = $tdBackend.family
    containerDefinitions = $tdBackend.containerDefinitions
    executionRoleArn = $tdBackend.executionRoleArn
    networkMode = $tdBackend.networkMode
    requiresCompatibilities = $tdBackend.requiresCompatibilities
    cpu = $tdBackend.cpu
    memory = $tdBackend.memory
}
if ($tdBackend.taskRoleArn) { $backendParams.taskRoleArn = $tdBackend.taskRoleArn }
if ($tdBackend.volumes -and $tdBackend.volumes.Count -gt 0) { $backendParams.volumes = $tdBackend.volumes }
$backendParams | ConvertTo-Json -Depth 10 | Out-File -FilePath "$env:TEMP\td-backend.json" -Encoding utf8
$newBackendRev = aws ecs register-task-definition --cli-input-json "file://$env:TEMP\td-backend.json" --query "taskDefinition.{family:family,revision:revision}" | ConvertFrom-Json
Write-Host "Backend task def registered: $($newBackendRev.family):$($newBackendRev.revision)" -ForegroundColor Green

# Frontend: register new task def revision pointing to :latest
$tdFrontend = aws ecs describe-task-definition --task-definition iluase-prod-frontend --query "taskDefinition" | ConvertFrom-Json
$tdFrontend.containerDefinitions[0].image = "${FRONTEND_REPO}:latest"
$frontendParams = @{
    family = $tdFrontend.family
    containerDefinitions = $tdFrontend.containerDefinitions
    executionRoleArn = $tdFrontend.executionRoleArn
    networkMode = $tdFrontend.networkMode
    requiresCompatibilities = $tdFrontend.requiresCompatibilities
    cpu = $tdFrontend.cpu
    memory = $tdFrontend.memory
}
if ($tdFrontend.taskRoleArn) { $frontendParams.taskRoleArn = $tdFrontend.taskRoleArn }
if ($tdFrontend.volumes -and $tdFrontend.volumes.Count -gt 0) { $frontendParams.volumes = $tdFrontend.volumes }
$frontendParams | ConvertTo-Json -Depth 10 | Out-File -FilePath "$env:TEMP\td-frontend.json" -Encoding utf8
$newFrontendRev = aws ecs register-task-definition --cli-input-json "file://$env:TEMP\td-frontend.json" --query "taskDefinition.{family:family,revision:revision}" | ConvertFrom-Json
Write-Host "Frontend task def registered: $($newFrontendRev.family):$($newFrontendRev.revision)" -ForegroundColor Green

Write-Host "=== Deploying new task definitions to ECS ===" -ForegroundColor Cyan
aws ecs update-service --cluster iluase-prod --service iluase-backend --task-definition "$($newBackendRev.family):$($newBackendRev.revision)" --force-new-deployment --region $REGION --output text --query "service.serviceName"
aws ecs update-service --cluster iluase-prod --service iluase-frontend --task-definition "$($newFrontendRev.family):$($newFrontendRev.revision)" --force-new-deployment --region $REGION --output text --query "service.serviceName"

Write-Host "=== Invalidating CloudFront cache ===" -ForegroundColor Cyan
$DIST_ID = "EHB5M2I36BDVR"
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" --query "Invalidation.{Id:Id,Status:Status}" --output table

Write-Host "=== DONE - ECS is deploying new tasks ===" -ForegroundColor Green

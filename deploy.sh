#!/bin/bash
set -e

ACCOUNT=091653536932
REGION=us-east-1
BACKEND_REPO=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/backend
FRONTEND_REPO=$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iluase/frontend

echo "=== Logging in to ECR ==="
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT.dkr.ecr.$REGION.amazonaws.com
echo "Login successful"

echo "=== Building backend ==="
docker build -f backend/Dockerfile -t $BACKEND_REPO:latest .
echo "Backend build done"

echo "=== Pushing backend ==="
docker push $BACKEND_REPO:latest
echo "Backend push done"

echo "=== Building frontend ==="
docker build -f frontend/Dockerfile.production -t $FRONTEND_REPO:latest .
echo "Frontend build done"

echo "=== Pushing frontend ==="
docker push $FRONTEND_REPO:latest
echo "Frontend push done"

echo "=== Forcing ECS redeployment ==="
aws ecs update-service --cluster iluase-prod --service iluase-backend --force-new-deployment --region $REGION --output text --query 'service.serviceName'
aws ecs update-service --cluster iluase-prod --service iluase-frontend --force-new-deployment --region $REGION --output text --query 'service.serviceName'

echo "=== DONE — ECS is deploying new tasks ==="

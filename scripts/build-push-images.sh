#!/usr/bin/env bash
# ============================================================
# Build the backend and frontend production images for the current commit
# and push them to ECR as :<short-sha> and :latest, then confirm both tags
# point at the same digest (see docs/active/DEPLOYMENT_PROCEDURES.md
# "Verify by digest"). Refuses to build with uncommitted changes, so the
# image always matches a commit.
#
# Usage: AWS_CLI=/Users/a40/Library/Python/3.9/bin/aws scripts/build-push-images.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
AWS="${AWS_CLI:-aws}"
REG=091653536932.dkr.ecr.us-east-1.amazonaws.com
SHA=$(git rev-parse --short HEAD)

if [ -n "$(git status --porcelain -- backend frontend common package.json package-lock.json)" ]; then
  echo "Uncommitted changes in the app; commit first so the image matches a commit." >&2
  exit 1
fi

"$AWS" ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$REG"
docker build --platform linux/amd64 -f backend/Dockerfile -t "${REG}/iluase/backend:${SHA}" -t "${REG}/iluase/backend:latest" .
docker build --platform linux/amd64 -f frontend/Dockerfile.production -t "${REG}/iluase/frontend:${SHA}" -t "${REG}/iluase/frontend:latest" .

for r in backend frontend; do
  docker push "${REG}/iluase/${r}:${SHA}"
  docker push "${REG}/iluase/${r}:latest"
  a=$("$AWS" ecr describe-images --repository-name "iluase/${r}" --region us-east-1 --image-ids imageTag="${SHA}" --query 'imageDetails[0].imageDigest' --output text)
  b=$("$AWS" ecr describe-images --repository-name "iluase/${r}" --region us-east-1 --image-ids imageTag=latest --query 'imageDetails[0].imageDigest' --output text)
  [ "$a" = "$b" ] || { echo "DIGEST MISMATCH $r: ${SHA}=$a latest=$b" >&2; exit 1; }
  echo "PUSHED $r $SHA $a"
done
echo BUILD-PUSH-OK

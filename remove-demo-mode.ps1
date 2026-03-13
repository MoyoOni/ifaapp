# Production Cleanup Script: Remove all demo mode code
# This script removes isDemoMode imports and fallback error handling from all frontend files

$frontend = "c:\Users\Test\ifa_app\frontend\src"

# Files to clean
$files = @(
    "features\academy\lesson-player-view.tsx",
    "features\admin\advisory-board-voting-view.tsx",
    "features\admin\fraud-alerts-view.tsx",
    "features\admin\payout-approvals-view.tsx",
    "features\admin\vendor-review-view.tsx",
    "features\admin\temple-management-view.tsx",
    "features\admin\verification-queue-view.tsx",
    "features\admin\analytics-dashboard-view.tsx",
    "features\appointments\appointments-calendar.tsx",
    "features\babalawo\discovery\babalawo-discovery-view.tsx",
    "features\circles\circle-detail-view.tsx",
    "features\events\events-directory.tsx",
    "features\events\event-detail-view.tsx",
    "features\forum\forum-home-view.tsx",
    "features\forum\thread-view.tsx",
    "features\forum\create-thread-form.tsx",
    "features\marketplace\checkout-view.tsx",
    "features\marketplace\vendor-dashboard-view.tsx",
    "features\marketplace\vendor-product-list-view.tsx",
    "features\marketplace\vendor-dashboard\orders-management.tsx",
    "features\messages\thread\message-thread.tsx",
    "features\prescriptions\babalawo-guidance-plans-view.tsx",
    "features\prescriptions\prescription-approval-view.tsx",
    "features\prescriptions\prescription-history-view.tsx",
    "features\profile\hooks\use-profile-query.ts",
    "features\temple\temple-detail-view.tsx",
    "features\temple\temple-directory.tsx",
    "features\wallet\wallet-dashboard-view.tsx",
    "shared\hooks\dashboard\use-client-dashboard.ts",
    "shared\hooks\dashboard\use-my-dashboard.ts",
    "shared\hooks\dashboard\use-vendor-dashboard.ts",
    "shared\hooks\dashboard\use-babalawo-dashboard.ts",
    "shared\hooks\use-api-query.ts",
    "shared\hooks\use-auth.ts",
    "shared\components\error-boundary.tsx"
)

# For each file, remove isDemoMode imports and fallback patterns
foreach ($file in $files) {
    $fullPath = Join-Path $frontend $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content -Path $fullPath -Raw
        
        # Remove isDemoMode import
        $content = $content -replace "import\s*\{\s*isDemoMode\s*\}\s*from\s*['\`"]@/shared/config/demo-mode['\`"];\s*", ""
        $content = $content -replace "import\s*\{\s*isDemoMode\s*as\s*_isDemoMode\s*\}\s*from\s*['\`"]@/shared/config/demo-mode['\`"];\s*", ""
        
        # Remove: if (!isDemoMode) throw error;
        $content = $content -replace "if\s*\(\s*!isDemoMode\s*\)\s*throw\s*\w+;", "throw error;"
        
        Set-Content -Path $fullPath -Value $content
        Write-Host "Cleaned: $file"
    } else {
        Write-Host "SKIPPED: $file (not found)"
    }
}

Write-Host "Cleanup complete!"


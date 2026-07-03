# ISESE Design System Color Migration Script
# Replaces old color classes with new ISESE design system classes

$files = Get-ChildItem -Path "frontend\src" -Recurse -Include *.tsx,*.ts

Write-Host "Found $($files.Count) files to process..."

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match 'ase-') {
        Write-Host "Processing: $($file.FullName)"
        
        # Replace color classes
        $content = $content -replace 'ase-gold', 'highlight'
        $content = $content -replace 'ase-stone-muted', 'muted'
        $content = $content -replace 'ase-clay', 'secondary'
        $content = $content -replace 'ase-forest', 'primary'
        $content = $content -replace 'ase-ivory', 'card'
        
        # Context-aware replacements for ase-stone
        $content = $content -replace 'bg-ase-stone', 'bg-background'
        $content = $content -replace 'text-ase-stone', 'text-foreground'
        $content = $content -replace 'border-ase-stone', 'border-border'
        
        # Handle remaining ase-stone (usually in class lists)
        $content = $content -replace '\base-stone\b', 'foreground'
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
    }
}

Write-Host "Migration complete!"

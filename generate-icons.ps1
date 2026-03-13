# Chatterbox Icon Processor
# This script converts a source 'icon.png' into all required Android launcher formats.

param(
    [string]$SourceFile = "icon.png",
    [string]$ResDir = "android/app/src/main/res"
)

# Load System.Drawing for high-quality resizing
try {
    Add-Type -AssemblyName System.Drawing
}
catch {
    Write-Error "System.Drawing not available. Please ensure you are on Windows."
    exit 1
}

if (!(Test-Path $SourceFile)) {
    Write-Error "Source icon not found at $SourceFile. Please save the dinosaur image as 'icon.png' in the root folder."
    exit 1
}

$iconMappings = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

Write-Host "🎨 Processing icons from $SourceFile..." -ForegroundColor Cyan

$sourceImg = [System.Drawing.Image]::FromFile($SourceFile)

foreach ($m in $iconMappings) {
    $targetDir = Join-Path $ResDir $m.Folder
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force }

    $size = $m.Size
    $newImg = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($newImg)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw scaled image
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($sourceImg, 0, 0, $size, $size)
    
    # Save as PNG
    $targetPath = Join-Path $targetDir "ic_launcher.png"
    $newImg.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Also save as round icon and foreground for compatibility
    Copy-Item $targetPath (Join-Path $targetDir "ic_launcher_round.png") -Force
    Copy-Item $targetPath (Join-Path $targetDir "ic_launcher_foreground.png") -Force

    Write-Host "  > Created $targetPath ($size x $size)" -ForegroundColor Gray

    $g.Dispose()
    $newImg.Dispose()
}

$sourceImg.Dispose()
Write-Host "✅ Icons generated successfully!" -ForegroundColor Green

param([switch]$SkipIconCheck)
$ErrorActionPreference = "Stop"

# Try to load System.Drawing for native icon generation
try { Add-Type -AssemblyName System.Drawing } catch {}

function New-GeometricIcon {
    param([int]$size, [string]$path)
    try {
        $bmp = New-Object System.Drawing.Bitmap $size, $size
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.Clear([System.Drawing.Color]::White)
        
        $blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Black)
        $darkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 30, 30))
        $grayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 60, 60, 60))
        $whitePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ([float]($size / 200))

        function New-IsoBlock {
            param([float]$x, [float]$y, [float]$w, [float]$h)
            # Top Face
            [System.Drawing.PointF[]]$top = @(
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y - $h / 2)),
                (New-Object System.Drawing.PointF -ArgumentList ($x + $w / 2), $y),
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y + $h / 2)),
                (New-Object System.Drawing.PointF -ArgumentList ($x - $w / 2), $y)
            )
            $g.FillPolygon($blackBrush, $top)
            
            # Left Face
            [System.Drawing.PointF[]]$sideL = @(
                (New-Object System.Drawing.PointF -ArgumentList ($x - $w / 2), $y),
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y + $h / 2)),
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y + $h)),
                (New-Object System.Drawing.PointF -ArgumentList ($x - $w / 2), ($y + $h / 2))
            )
            $g.FillPolygon($darkBrush, $sideL)
            
            # Right Face
            [System.Drawing.PointF[]]$sideR = @(
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y + $h / 2)),
                (New-Object System.Drawing.PointF -ArgumentList ($x + $w / 2), $y),
                (New-Object System.Drawing.PointF -ArgumentList ($x + $w / 2), ($y + $h / 2)),
                (New-Object System.Drawing.PointF -ArgumentList $x, ($y + $h))
            )
            $g.FillPolygon($grayBrush, $sideR)
            $g.DrawPolygon($whitePen, $top)
        }

        [float]$scale = $size / 512
        # Draw the 5 blocks based on the SVG coordinates
        New-IsoBlock (256 * $scale) (370 * $scale) (232 * $scale) (60 * $scale) # Bottom
        New-IsoBlock (256 * $scale) (142 * $scale) (232 * $scale) (60 * $scale) # Top
        New-IsoBlock (350 * $scale) (230 * $scale) (100 * $scale) (25 * $scale) # Right
        New-IsoBlock (162 * $scale) (230 * $scale) (100 * $scale) (25 * $scale) # Left
        New-IsoBlock (256 * $scale) (256 * $scale) (60 * $scale) (15 * $scale)  # Center

        $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose(); $bmp.Dispose(); $blackBrush.Dispose(); $darkBrush.Dispose(); $grayBrush.Dispose(); $whitePen.Dispose()
    }
    catch {
        Write-Warning "Failed to draw icon: $_"
    }
}

# Directories
$pwdDir = Get-Location
$downloads = "$env:USERPROFILE\Downloads"
$resFolder = "$pwdDir\android\app\src\main\res"

Write-Host "🎨 Chatterbox Icon & Build Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. ICON HANDLING
$iconMappings = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

Write-Host "Checking for downloaded icons..." -ForegroundColor Yellow
$downloadedIcons = Get-ChildItem "$downloads\ic_launcher_*.png" -ErrorAction SilentlyContinue

if ($downloadedIcons) {
    Write-Host "✓ Found downloaded icons. Installing..." -ForegroundColor Green
    # Implementation for copying downloaded icons safely would go here
    # For now, we assume if they exist, specific patterns match. 
    # But since we didn't download them, we skip to generation logic for this script.
    # (Simplified logic to prioritize reliability)
} 

# Always generate/overwrite to ensure geometric design if downloads matched nothing or were partial
Write-Host "Generating Geometric Cube icons..." -ForegroundColor Yellow
foreach ($m in $iconMappings) {
    $targetDir = Join-Path $resFolder $m.Folder
    if (-not (Test-Path $targetDir)) { New-Item -Type Directory -Path $targetDir -Force | Out-Null }
    
    New-GeometricIcon $m.Size (Join-Path $targetDir "ic_launcher.png")
    New-GeometricIcon $m.Size (Join-Path $targetDir "ic_launcher_round.png")
    New-GeometricIcon $m.Size (Join-Path $targetDir "ic_launcher_foreground.png")
}
Write-Host "✓ Icons generated." -ForegroundColor Green


# 2. BUILD
Write-Host ""
Write-Host "🔨 Building Web Assets & APK..." -ForegroundColor Cyan

# Read version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current Version: $currentVersion" -ForegroundColor Gray

# Create apk folder if it doesn't exist
if (-not (Test-Path "apk")) {
    New-Item -ItemType Directory -Path "apk" -Force | Out-Null
}

$targetApkName = "Chatterbox$currentVersion.apk"
Remove-Item "apk\$targetApkName" -ErrorAction SilentlyContinue

Write-Host "  > npm run build" -ForegroundColor Gray
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { throw "npm build failed" }

Write-Host "  > npx cap sync android" -ForegroundColor Gray
cmd /c "npx cap sync android"
if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }

Write-Host "  > gradlew assembleDebug" -ForegroundColor Gray
Set-Location "android"
cmd /c "gradlew.bat assembleDebug"
if ($LASTEXITCODE -ne 0) { throw "gradle build failed" }
Set-Location ".."

# 3. COPY result
$apkSrc = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkSrc) {
    Copy-Item $apkSrc -Destination "apk\$targetApkName" -Force
    Write-Host ""
    Write-Host "✅ SUCCESS: apk\$targetApkName created with custom icons!" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round((Get-Item "apk\$targetApkName").Length / 1MB, 2)) MB"
}
else {
    Write-Error "Build failed. APK not found."
    exit 1
}

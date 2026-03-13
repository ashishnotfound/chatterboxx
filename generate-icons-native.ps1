Add-Type -AssemblyName System.Drawing

$resBase = "$PSScriptRoot\android\app\src\main\res"

if (-not (Test-Path $resBase)) {
    Write-Error "Could not find android resource folder at $resBase"
    exit 1
}

$sizes = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

function Draw-GeometricIcon {
    param([int]$size, [string]$path)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::White)

    # Colors
    $blackBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
    $whitePen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, $size / 20)

    # Calc dimensions for a simple isometric cube
    $cx = $size / 2
    $cy = $size / 2
    $radius = $size * 0.35
    
    # Points for a hexagon (isometric cube outline)
    $points = @(
        New-Object System.Drawing.PointF ($cx, $cy - $radius),                 # Top
        New-Object System.Drawing.PointF ($cx + $radius * 0.866, $cy - $radius / 2), # Top Right
        New-Object System.Drawing.PointF ($cx + $radius * 0.866, $cy + $radius / 2), # Bottom Right
        New-Object System.Drawing.PointF ($cx, $cy + $radius),                 # Bottom
        New-Object System.Drawing.PointF ($cx - $radius * 0.866, $cy + $radius / 2), # Bottom Left
        New-Object System.Drawing.PointF ($cx - $radius * 0.866, $cy - $radius / 2)  # Top Left
    )

    # Fill hexagon
    $g.FillPolygon($blackBrush, $points)
    
    # Draw internal lines to make it a cube
    $g.DrawLine($whitePen, $cx, $cy, $cx, $cy - $radius)
    $g.DrawLine($whitePen, $cx, $cy, $cx + $radius * 0.866, $cy + $radius / 2)
    $g.DrawLine($whitePen, $cx, $cy, $cx - $radius * 0.866, $cy + $radius / 2)
    
    # Draw outline
    $g.DrawPolygon($whitePen, $points)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $blackBrush.Dispose()
    $whitePen.Dispose()
}

Write-Host "🎨 Generating icons..." -ForegroundColor Cyan

foreach ($s in $sizes) {
    $folder = Join-Path $resBase $s.Folder
    if (-not (Test-Path $folder)) { New-Item -Type Directory -Path $folder -Force | Out-Null }
    
    $file = Join-Path $folder "ic_launcher.png"
    Draw-GeometricIcon -size $s.Size -path $file
    
    $roundFile = Join-Path $folder "ic_launcher_round.png"
    Draw-GeometricIcon -size $s.Size -path $roundFile
    
    # Foreground for adaptive icon (simplified)
    $foregroundFile = Join-Path $folder "ic_launcher_foreground.png"
    Draw-GeometricIcon -size $s.Size -path $foregroundFile
    
    Write-Host "✓ $($s.Folder) ($($s.Size)px)" -ForegroundColor Green
}

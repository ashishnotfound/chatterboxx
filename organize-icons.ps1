# Chatterbox Icon Organizer Script
# This script moves the generated icons to the correct Android mipmap folders

$downloadFolder = "$env:USERPROFILE\Downloads"
$projectRoot = "c:\Users\MAHADEV\Downloads\chatterboxx-main"
$resFolder = "$projectRoot\android\app\src\main\res"

Write-Host "🎨 Chatterbox Icon Organizer" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Define the icon mappings
$iconMappings = @(
    @{ Folder = "mipmap-mdpi"; Size = 48 },
    @{ Folder = "mipmap-hdpi"; Size = 72 },
    @{ Folder = "mipmap-xhdpi"; Size = 96 },
    @{ Folder = "mipmap-xxhdpi"; Size = 144 },
    @{ Folder = "mipmap-xxxhdpi"; Size = 192 }
)

Write-Host "Looking for icon files in: $downloadFolder" -ForegroundColor Yellow
Write-Host ""

$filesFound = 0
$filesMoved = 0

foreach ($mapping in $iconMappings) {
    $folderName = $mapping.Folder
    $targetFolder = Join-Path $resFolder $folderName
    
    # Icon file patterns to look for
    $patterns = @(
        "ic_launcher_$folderName.png",
        "ic_launcher_foreground_$folderName.png",
        "ic_launcher_round_$folderName.png"
    )
    
    foreach ($pattern in $patterns) {
        $sourceFile = Join-Path $downloadFolder $pattern
        
        if (Test-Path $sourceFile) {
            $filesFound++
            
            # Determine the target filename
            $targetFileName = $pattern -replace "_$folderName", ""
            $targetFile = Join-Path $targetFolder $targetFileName
            
            # Copy the file
            try {
                Copy-Item -Path $sourceFile -Destination $targetFile -Force
                Write-Host "✓ Copied $pattern -> $folderName\$targetFileName" -ForegroundColor Green
                $filesMoved++
            } catch {
                Write-Host "✗ Failed to copy $pattern" -ForegroundColor Red
                Write-Host "  Error: $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files found: $filesFound" -ForegroundColor $(if ($filesFound -gt 0) { "Green" } else { "Yellow" })
Write-Host "  Files moved: $filesMoved" -ForegroundColor $(if ($filesMoved -gt 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($filesMoved -gt 0) {
    Write-Host "✓ Icons successfully organized!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npm run build" -ForegroundColor White
    Write-Host "  2. Run: npx cap sync android" -ForegroundColor White
    Write-Host "  3. Build APK: cd android && .\gradlew.bat assembleDebug" -ForegroundColor White
} else {
    Write-Host "⚠ No icon files found in Downloads folder." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Cyan
    Write-Host "  1. Open icon-generator.html in your browser" -ForegroundColor White
    Write-Host "  2. Click 'Generate All Icons'" -ForegroundColor White
    Write-Host "  3. Wait for all downloads to complete" -ForegroundColor White
    Write-Host "  4. Run this script again" -ForegroundColor White
}

Write-Host ""

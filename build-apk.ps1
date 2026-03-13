# Chatterbox APK Build Script with Auto-Version Increment
# Usage: .\build-apk.ps1

Write-Host "🔄 Incrementing version number..." -ForegroundColor Yellow

# 1. Update package.json
$packageContent = Get-Content package.json -Raw | ConvertFrom-Json
$oldVersion = $packageContent.version
$versionParts = $oldVersion.Split('.')
$versionParts[2] = [int]$versionParts[2] + 1
$VERSION = $versionParts -join '.'
$packageContent.version = $VERSION
$packageContent | ConvertTo-Json -Depth 20 | Set-Content package.json

# 2. Update android/app/build.gradle
$gradlePath = "android/app/build.gradle"
$gradleContent = Get-Content $gradlePath -Raw

# Robustly find and increment versionCode
$versionCodeMatch = [regex]::Match($gradleContent, 'versionCode (\d+)')
if ($versionCodeMatch.Success) {
    $oldCode = $versionCodeMatch.Groups[1].Value
    $newCode = [int]$oldCode + 1
    $gradleContent = $gradleContent -replace "versionCode $oldCode", "versionCode $newCode"
    Write-Host "  > versionCode: $oldCode -> $newCode" -ForegroundColor Gray
}

# Update versionName
$gradleContent = $gradleContent -replace 'versionName ".*"', "versionName ""$VERSION"""
Write-Host "  > versionName: $oldVersion -> $VERSION" -ForegroundColor Gray

$gradleContent | Set-Content $gradlePath

# Standardized APK naming to avoid confusion
$APK_NAME = "ChatterBox-v$VERSION.apk"
$OUTPUT_DIR = "apk"

Write-Host "🚀 Starting build for Chatterbox v$VERSION..." -ForegroundColor Cyan

# 0. Process Icons (if source exists)
if (Test-Path "icon.png") {
    Write-Host "🎨 New icon detected! Processing launcher icons..." -ForegroundColor Yellow
    pwsh -ExecutionPolicy Bypass -File generate-icons.ps1
}

# 1. Build Web Assets
Write-Host "📦 Building web assets..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Web build failed"; exit $LASTEXITCODE }

# 2. Sync with Capacitor
Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Error "Capacitor sync failed"; exit $LASTEXITCODE }

# 3. Build Android APK
Write-Host "🤖 Building Android APK..." -ForegroundColor Yellow
Set-Location android
Write-Host "  > gradlew.bat clean" -ForegroundColor Gray
.\gradlew.bat clean
Write-Host "  > gradlew.bat assembleDebug" -ForegroundColor Gray
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Write-Error "Android build failed"; Set-Location ..; exit $LASTEXITCODE }
Set-Location ..

# 4. Copy APK to destination
Write-Host "📂 Copying APK to $OUTPUT_DIR/$APK_NAME..." -ForegroundColor Green
if (!(Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR }

Copy-Item "android/app/build/outputs/apk/debug/app-debug.apk" "$OUTPUT_DIR/$APK_NAME" -Force

Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host "🚀 MOBILE LOGO FIX GUIDE:" -ForegroundColor Yellow
Write-Host "1. UNINSTALL the old app from your phone." -ForegroundColor Gray
Write-Host "2. Go to Settings > Apps > Chatterbox > Storage > Clear Cache." -ForegroundColor Gray
Write-Host "3. Install the NEW APK: $OUTPUT_DIR/$APK_NAME" -ForegroundColor Gray
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host "✅ Build Complete!" -ForegroundColor Green

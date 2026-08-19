$ErrorActionPreference = 'Stop'

$javaCommand = Get-Command java -ErrorAction Stop
$javaBin = Split-Path -Parent $javaCommand.Source
$env:JAVA_HOME = Split-Path -Parent $javaBin

$defaultAndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = $defaultAndroidSdk
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

$javaVersion = & $javaCommand.Source --version | Select-Object -First 1
if ($javaVersion -notmatch '\b21\.') {
  throw "Capacitor 8 requires JDK 21. Current runtime: $javaVersion"
}
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
  throw "Android SDK not found: $env:ANDROID_HOME"
}

npm run android:sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location (Join-Path $PSScriptRoot '..\android')
try {
  & .\gradlew.bat assembleDebug
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$apkSource = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
$artifactsDir = Join-Path $projectRoot 'artifacts'
$package = Get-Content -Raw (Join-Path $projectRoot 'package.json') | ConvertFrom-Json
$apkTarget = Join-Path $artifactsDir "QalaFix-AI-$($package.version)-neural.apk"

if (-not (Test-Path -LiteralPath $apkSource)) {
  throw "Android build finished without APK: $apkSource"
}
if (-not (Test-Path -LiteralPath $artifactsDir)) {
  New-Item -ItemType Directory -Path $artifactsDir | Out-Null
}

Copy-Item -LiteralPath $apkSource -Destination $apkTarget -Force
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$apkStream = [System.IO.File]::OpenRead($apkTarget)
try {
  $apkHash = ([System.BitConverter]::ToString($sha256.ComputeHash($apkStream))).Replace('-', '').ToLowerInvariant()
} finally {
  $apkStream.Dispose()
  $sha256.Dispose()
}
Write-Host "APK ready: $apkTarget"
Write-Host "SHA256: $apkHash"

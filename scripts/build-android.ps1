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

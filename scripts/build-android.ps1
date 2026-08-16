$ErrorActionPreference = 'Stop'

$javaCommand = Get-Command java -ErrorAction Stop
$javaBin = Split-Path -Parent $javaCommand.Source
$env:JAVA_HOME = Split-Path -Parent $javaBin

$defaultAndroidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = $defaultAndroidSdk
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

$javaVersion = & $javaCommand.Source -version 2>&1 | Select-Object -First 1
if ($javaVersion -notmatch 'version "21') {
  throw "Для Capacitor 8 требуется JDK 21. Сейчас используется: $javaVersion"
}
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
  throw "Android SDK не найден: $env:ANDROID_HOME"
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

param(
    [switch]$CrxOnly,
    [switch]$ZipOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildDir = Join-Path $root 'build'
$tempDir = Join-Path $buildDir '_pack'
$version = (Get-Content (Join-Path $root 'manifest.json') | ConvertFrom-Json).version

# Files to include in the package
$include = @(
    'manifest.json',
    'background.js',
    'popup.html',
    'popup.js',
    'icon16.png',
    'icon48.png',
    'LICENSE',
    'PRIVACY.md'
)

Write-Host "Building Google Clean Search v$version" -ForegroundColor Cyan
Write-Host ""

# Clean up
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files
foreach ($file in $include) {
    $src = Join-Path $root $file
    if (Test-Path $src) {
        Copy-Item $src $tempDir
        Write-Host "  + $file" -ForegroundColor DarkGray
    } else {
        Write-Host "  ! $file (missing, skipped)" -ForegroundColor Yellow
    }
}

# Copy rules directory if it exists and has files
$rulesDir = Join-Path $root 'rules'
if ((Test-Path $rulesDir) -and (Get-ChildItem $rulesDir).Count -gt 0) {
    Copy-Item $rulesDir (Join-Path $tempDir 'rules') -Recurse
    Write-Host "  + rules/" -ForegroundColor DarkGray
}

Write-Host ""

# Build ZIP
if (-not $CrxOnly) {
    $zipPath = Join-Path $buildDir "google-clean-search-v$version.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $zipPath
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
    Write-Host "ZIP: $zipPath ($zipSize KB)" -ForegroundColor Green
}

# Build CRX
if (-not $ZipOnly) {
    # Find Chrome or Chromium
    $chromePaths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Chromium\Application\chrome.exe",
        "${env:ProgramFiles}\Chromium\Application\chrome.exe"
    )
    
    $chrome = $null
    foreach ($p in $chromePaths) {
        if (Test-Path $p) { $chrome = $p; break }
    }

    if (-not $chrome) {
        Write-Host "CRX: Chrome/Chromium not found, skipping .crx build" -ForegroundColor Yellow
        Write-Host "     Set CHROME_PATH env variable or pass path manually" -ForegroundColor DarkGray
    } else {
        $keyFile = Join-Path $buildDir 'extension.pem'
        $args = "--pack-extension=`"$tempDir`""
        if (Test-Path $keyFile) {
            $args += " --pack-extension-key=`"$keyFile`""
        }
        
        Start-Process -FilePath $chrome -ArgumentList $args -Wait -NoNewWindow
        
        # Chrome creates .crx and .pem next to the packed directory
        $generatedCrx = "$tempDir.crx"
        $generatedPem = "$tempDir.pem"
        
        if (Test-Path $generatedCrx) {
            $crxDest = Join-Path $buildDir "google-clean-search-v$version.crx"
            Move-Item $generatedCrx $crxDest -Force
            $crxSize = [math]::Round((Get-Item $crxDest).Length / 1KB, 1)
            Write-Host "CRX: $crxDest ($crxSize KB)" -ForegroundColor Green
        }
        
        # Save the key for future builds (keep same extension ID)
        if ((Test-Path $generatedPem) -and -not (Test-Path $keyFile)) {
            Move-Item $generatedPem $keyFile -Force
            Write-Host ""
            Write-Warning "New signing key generated: $keyFile"
            Write-Warning "DO NOT commit this file to git. Store it in a password manager."
            Write-Warning "Without it, the extension ID will change on the next build."
            Write-Host ""
        } elseif (Test-Path $generatedPem) {
            Remove-Item $generatedPem -Force
        }
    }
}

# Clean temp
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan

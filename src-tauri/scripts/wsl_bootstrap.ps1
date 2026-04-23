# WSL2 引导：确保 WSL 已启用并安装 Ubuntu-22.04
# 参数：
#   -UseCN    使用清华 rootfs 镜像（离线导入）
#   -DistroName  发行版名称，默认 Ubuntu-22.04
[CmdletBinding()]
param(
    [switch]$UseCN,
    [string]$DistroName = "Ubuntu-22.04"
)

$ErrorActionPreference = "Stop"
function Info($m) { Write-Host "[wsl-bootstrap] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "[  ok  ] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[ warn ] $m" -ForegroundColor Yellow }
function Err($m)  { Write-Host "[ ERROR ] $m" -ForegroundColor Red }

# ---------- 工具函数 ----------

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-WSL {
    # 多种方式检测 WSL 是否已安装并可用
    try {
        $null = wsl.exe --version 2>&1
        if ($LASTEXITCODE -eq 0) { return $true }
    } catch {}
    try {
        $null = wsl.exe --status 2>&1
        if ($LASTEXITCODE -eq 0) { return $true }
    } catch {}
    try {
        $null = wsl.exe -l 2>&1
        if ($LASTEXITCODE -eq 0) { return $true }
    } catch {}
    return $false
}

function Get-InstalledDistros {
    try {
        $raw = wsl.exe -l -q 2>$null
        $list = $raw | ForEach-Object { ($_ -replace '\x00','').Trim() } | Where-Object { $_ -ne '' }
        return @($list)
    } catch {
        return @()
    }
}

# ---------- 安装函数 ----------

function Enable-WSLFeatures {
    if (-not (Test-IsAdmin)) {
        Err "WSL feature not enabled and no admin privileges. Use Doctor fix (elevated) first."
        exit 1
    }
    Info "Enabling WSL and VirtualMachinePlatform features"
    $f1 = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue
    if ($f1 -and $f1.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart | Out-Null
    }
    $f2 = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue
    if ($f2 -and $f2.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart | Out-Null
    }
    Ok "WSL features enabled (reboot may be required if first time)"
}

function Install-WSLCore {
    if ($UseCN) {
        Info "CN mode: downloading WSL2 kernel update"
        $kernelUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
        $kernelMsi = Join-Path $env:TEMP "wsl_update_x64.msi"
        if (-not (Test-Path $kernelMsi)) {
            Info "Downloading WSL2 kernel: $kernelUrl"
            $ProgressPreference = "SilentlyContinue"
            try {
                Invoke-WebRequest -Uri $kernelUrl -OutFile $kernelMsi -TimeoutSec 60
            } catch {
                Warn "WSL kernel download failed, trying to continue..."
            }
        }
        if (Test-Path $kernelMsi) {
            Info "Installing WSL2 kernel update"
            Start-Process msiexec.exe -ArgumentList "/i", $kernelMsi, "/quiet", "/norestart" -Wait -NoNewWindow
            Ok "WSL2 kernel installed"
        }
        wsl.exe --set-default-version 2 2>&1 | ForEach-Object { Write-Host $_ }
    } else {
        Info "Running wsl --install --no-distribution"
        wsl.exe --install --no-distribution 2>&1 | ForEach-Object { Write-Host $_ }
        wsl.exe --set-default-version 2 2>&1 | ForEach-Object { Write-Host $_ }
    }
}

function Import-UbuntuOffline {
    param([string]$RootfsUrl, [string]$Name)
    $dest = Join-Path $env:LOCALAPPDATA "wsl\$Name"
    New-Item -ItemType Directory -Force $dest | Out-Null
    $tar = Join-Path $env:TEMP "$Name.rootfs.tar.gz"
    if (-not (Test-Path $tar)) {
        Info "Downloading rootfs: $RootfsUrl"
        $ProgressPreference = "SilentlyContinue"
        Invoke-WebRequest -Uri $RootfsUrl -OutFile $tar
    }
    Info "Importing WSL distro: $Name"
    wsl.exe --import $Name $dest $tar --version 2 2>&1 | ForEach-Object { Write-Host $_ }
    Ok "Import done: $Name -> $dest"
}

function Ensure-Distro {
    $existing = Get-InstalledDistros
    Info "Installed distros: $($existing -join ', ')"
    if ($existing -contains $DistroName) {
        Ok "Distro already exists: $DistroName"
        return
    }
    if ($UseCN) {
        $url = "https://mirrors.tuna.tsinghua.edu.cn/ubuntu-cloud-images/wsl/jammy/current/ubuntu-jammy-wsl-amd64-ubuntu.rootfs.tar.gz"
        Import-UbuntuOffline -RootfsUrl $url -Name $DistroName
    } else {
        Info "Installing via Microsoft Store: $DistroName"
        wsl.exe --install -d $DistroName --no-launch 2>&1 | ForEach-Object { Write-Host $_ }
    }
}

# ---------- 主流程 ----------

$wslReady = Test-WSL
$distros = Get-InstalledDistros
$hasDistro = ($distros.Count -gt 0)

Info "WSL ready: $wslReady | Has distro: $hasDistro ($($distros -join ', '))"

# 快速路径：WSL 和发行版都已就绪，直接成功
if ($wslReady -and $hasDistro) {
    Ok "WSL and distro already set up, skipping bootstrap"
    try {
        wsl.exe --set-default-version 2 2>&1 | Out-Null
        wsl.exe --set-default $DistroName 2>&1 | Out-Null
    } catch {}
    Ok "WSL bootstrap done"
    exit 0
}

# WSL 未就绪 → 需要安装
if (-not $wslReady) {
    Enable-WSLFeatures
    Install-WSLCore
    # 首次启用后需重启
    Warn "If WSL features were just enabled, please reboot and re-run"
}

# 安装发行版
Ensure-Distro

try {
    wsl.exe --set-default $DistroName 2>&1 | ForEach-Object { Write-Host $_ }
} catch {}
Ok "WSL bootstrap done"

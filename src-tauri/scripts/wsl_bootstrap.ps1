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

function Test-WSL {
    try {
        $null = wsl.exe --status 2>&1
        return $LASTEXITCODE -eq 0
    } catch { return $false }
}

function Enable-WSLFeatures {
    Info "启用 WSL 和 VirtualMachinePlatform 功能"
    $f1 = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue
    if ($f1 -and $f1.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart | Out-Null
    }
    $f2 = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue
    if ($f2 -and $f2.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart | Out-Null
    }
    Ok "WSL 功能已启用（如刚启用可能需要重启）"
}

function Install-WSLCore {
    if ($UseCN) {
        Info "国内模式：下载并安装 WSL 内核更新包"
        # 微软官方 WSL2 内核更新包（国内可直连）
        $kernelUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
        $kernelMsi = Join-Path $env:TEMP "wsl_update_x64.msi"
        if (-not (Test-Path $kernelMsi)) {
            Info "下载 WSL2 内核: $kernelUrl"
            $ProgressPreference = "SilentlyContinue"
            try {
                Invoke-WebRequest -Uri $kernelUrl -OutFile $kernelMsi -TimeoutSec 60
            } catch {
                Warn "下载 WSL 内核失败，尝试继续..."
            }
        }
        if (Test-Path $kernelMsi) {
            Info "安装 WSL2 内核更新包"
            Start-Process msiexec.exe -ArgumentList "/i", $kernelMsi, "/quiet", "/norestart" -Wait -NoNewWindow
            Ok "WSL2 内核安装完成"
        }
        wsl.exe --set-default-version 2 2>&1 | ForEach-Object { Write-Host $_ }
    } else {
        Info "调用 wsl --install --no-distribution"
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
        Info "下载 rootfs: $RootfsUrl"
        $ProgressPreference = "SilentlyContinue"
        Invoke-WebRequest -Uri $RootfsUrl -OutFile $tar
    }
    Info "导入 WSL 发行版：$Name"
    wsl.exe --import $Name $dest $tar --version 2 2>&1 | ForEach-Object { Write-Host $_ }
    Ok "导入完成：$Name -> $dest"
}

function Ensure-Distro {
    $existing = (wsl.exe -l -q 2>$null | Where-Object { $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
    if ($existing -contains $DistroName) {
        Ok "发行版已存在：$DistroName"
        return
    }
    if ($UseCN) {
        $url = "https://mirrors.tuna.tsinghua.edu.cn/ubuntu-cloud-images/wsl/jammy/current/ubuntu-jammy-wsl-amd64-ubuntu.rootfs.tar.gz"
        Import-UbuntuOffline -RootfsUrl $url -Name $DistroName
    } else {
        Info "通过 Microsoft Store 安装：$DistroName"
        wsl.exe --install -d $DistroName --no-launch 2>&1 | ForEach-Object { Write-Host $_ }
    }
}

if (-not (Test-WSL)) {
    Enable-WSLFeatures
    Install-WSLCore
    Warn "若首次启用 WSL，请重启电脑后重新运行安装器"
}

Ensure-Distro
wsl.exe --set-default $DistroName 2>&1 | ForEach-Object { Write-Host $_ }
Ok "WSL 引导完成"

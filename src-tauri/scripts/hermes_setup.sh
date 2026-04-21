#!/usr/bin/env bash
# HermesAgent 核心安装脚本（WSL Ubuntu / macOS 通用）
# 环境变量：
#   HM_USE_CN=1         启用国内加速
#   HM_REPO_URL=...     仓库地址（默认根据 HM_USE_CN 选择）
#   HM_EXTRAS="all"     uv pip install -e ".[<extras>]" 的可选项
#   HM_PYTHON=3.11      Python 版本
set -euo pipefail

HM_USE_CN="${HM_USE_CN:-1}"
HM_PYTHON="${HM_PYTHON:-3.11}"
HM_EXTRAS="${HM_EXTRAS:-all}"

if [ "$HM_USE_CN" = "1" ]; then
    : "${HM_REPO_URL:=https://ghproxy.com/https://github.com/NousResearch/hermes-agent.git}"
    export UV_DEFAULT_INDEX="${UV_DEFAULT_INDEX:-https://pypi.tuna.tsinghua.edu.cn/simple}"
    export PIP_INDEX_URL="$UV_DEFAULT_INDEX"
else
    : "${HM_REPO_URL:=https://github.com/NousResearch/hermes-agent.git}"
fi

log() { printf "\033[1;36m[hermes-setup]\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m[  ok  ]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[ warn ]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[ err  ]\033[0m %s\n" "$*" >&2; }

detect_os() {
    case "$(uname -s)" in
        Linux*)  OS=linux ;;
        Darwin*) OS=macos ;;
        *)       err "Unsupported OS: $(uname -s)"; exit 1 ;;
    esac
}

ensure_pkg_linux() {
    local pkgs=("$@")
    log "apt 安装：${pkgs[*]}"
    sudo apt-get update -y
    sudo apt-get install -y "${pkgs[@]}"
}

ensure_pkg_mac() {
    local pkgs=("$@")
    log "brew 安装：${pkgs[*]}"
    brew install "${pkgs[@]}"
}

install_base_deps() {
    if [ "$OS" = "linux" ]; then
        if [ "$HM_USE_CN" = "1" ]; then
            log "切换 apt 源到清华镜像"
            sudo sed -i 's|http://archive.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list || true
            sudo sed -i 's|http://security.ubuntu.com|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list || true
        fi
        ensure_pkg_linux curl git build-essential ripgrep ffmpeg ca-certificates
    else
        if ! command -v brew >/dev/null 2>&1; then
            err "未检测到 Homebrew，请先运行宿主端 macOS 安装器"
            exit 1
        fi
        ensure_pkg_mac git ripgrep ffmpeg
    fi
}

install_uv() {
    if command -v uv >/dev/null 2>&1; then
        ok "uv 已安装：$(uv --version)"
        return
    fi
    log "安装 uv"
    if [ "$HM_USE_CN" = "1" ]; then
        export UV_INSTALLER_GITHUB_BASE_URL="https://ghproxy.com/https://github.com"
    fi
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    ok "uv 安装完成：$(uv --version || echo unknown)"
}

install_node() {
    if command -v node >/dev/null 2>&1 && [ "$(node -v | cut -c2- | cut -d. -f1)" -ge 20 ]; then
        ok "Node 已满足：$(node -v)"
        return
    fi
    if [ "$OS" = "linux" ]; then
        log "安装 Node 22 (NodeSource)"
        if [ "$HM_USE_CN" = "1" ]; then
            # 清华镜像 nodesource
            curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/setup_22.x | sudo -E bash - || \
                curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        else
            curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        fi
        sudo apt-get install -y nodejs
    else
        ensure_pkg_mac node@22
        brew link --overwrite --force node@22 || true
    fi
    if [ "$HM_USE_CN" = "1" ]; then
        npm config set registry https://registry.npmmirror.com
    fi
    ok "Node 安装完成：$(node -v)"
}

clone_hermes() {
    local target="$HOME/hermes-agent"
    if [ -d "$target/.git" ]; then
        log "hermes-agent 已存在，拉取更新"
        git -C "$target" pull --recurse-submodules --ff-only || true
        return
    fi
    log "克隆 hermes-agent 仓库"
    git clone --recurse-submodules "$HM_REPO_URL" "$target"
    ok "克隆完成：$target"
}

install_python_deps() {
    local repo="$HOME/hermes-agent"
    cd "$repo"
    log "创建虚拟环境 (Python $HM_PYTHON)"
    uv venv venv --python "$HM_PYTHON"
    export VIRTUAL_ENV="$repo/venv"
    log "安装 Python 依赖：[$HM_EXTRAS]"
    uv pip install -e ".[$HM_EXTRAS]"
    ok "Python 依赖安装完成"
}

setup_config_dir() {
    log "创建 ~/.hermes 目录"
    mkdir -p "$HOME/.hermes"/{cron,sessions,logs,memories,skills,pairing,hooks,image_cache,audio_cache,whatsapp/session}
    local repo="$HOME/hermes-agent"
    if [ ! -f "$HOME/.hermes/config.yaml" ] && [ -f "$repo/cli-config.yaml.example" ]; then
        cp "$repo/cli-config.yaml.example" "$HOME/.hermes/config.yaml"
    fi
    touch "$HOME/.hermes/.env"
    ok "配置目录就绪"
}

link_hermes_cli() {
    local repo="$HOME/hermes-agent"
    mkdir -p "$HOME/.local/bin"
    if [ -x "$repo/venv/bin/hermes" ]; then
        ln -sf "$repo/venv/bin/hermes" "$HOME/.local/bin/hermes"
    fi
    # 写入 PATH
    for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
        if [ -f "$rc" ] && ! grep -q '.local/bin' "$rc"; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc"
        fi
    done
    ok "hermes CLI 链接完成"
}

run_doctor() {
    log "运行 hermes doctor"
    if "$HOME/.local/bin/hermes" doctor; then
        ok "hermes doctor 通过"
    else
        warn "hermes doctor 有警告，具体查看上方输出"
    fi
}

main() {
    detect_os
    log "开始安装 HermesAgent · OS=$OS · CN=$HM_USE_CN"
    install_base_deps
    install_uv
    install_node
    clone_hermes
    install_python_deps
    setup_config_dir
    link_hermes_cli
    run_doctor
    ok "全部完成！在新终端执行 hermes 即可开始对话"
}

main "$@"

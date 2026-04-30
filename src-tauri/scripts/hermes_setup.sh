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

# GitHub 国内镜像候选列表（按可用性排序，会逐个尝试）
CN_GIT_MIRRORS=(
    "https://bgithub.xyz"
    "https://gh-proxy.com/https://github.com"
    "https://github.com"  # 直连兜底
)

if [ "$HM_USE_CN" = "1" ]; then
    export UV_DEFAULT_INDEX="${UV_DEFAULT_INDEX:-https://pypi.tuna.tsinghua.edu.cn/simple}"
    export PIP_INDEX_URL="$UV_DEFAULT_INDEX"
else
    : "${HM_REPO_URL:=https://github.com/NousResearch/hermes-agent.git}"
fi

log() { printf "\033[1;36m[hermes-setup]\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m[  ok  ]\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m[ warn ]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[ err  ]\033[0m %s\n" "$*" >&2; }

# 获取 WSL 默认用户（非 root）
get_default_user() {
    # 方法 1: 从 /etc/passwd 找 uid 1000 的用户
    local user
    user=$(awk -F: '$3 == 1000 { print $1 }' /etc/passwd 2>/dev/null)
    if [ -n "$user" ]; then
        echo "$user"
        return
    fi
    # 方法 2: 从 wsl.conf 读取
    if [ -f /etc/wsl.conf ]; then
        user=$(grep -oP '(?<=default=)\w+' /etc/wsl.conf 2>/dev/null | head -1)
        if [ -n "$user" ]; then
            echo "$user"
            return
        fi
    fi
    # 兜底：返回空
    echo ""
}

# 如果是 root 运行，设置目标用户用于最后 chown
setup_target_user() {
    if [ "$(id -u)" = "0" ]; then
        TARGET_USER=$(get_default_user)
        if [ -n "$TARGET_USER" ]; then
            log "以 root 运行，安装完成后将 chown 给用户: $TARGET_USER"
            # 设置 HOME 为目标用户的 home 目录
            export HOME="/home/$TARGET_USER"
        fi
    else
        TARGET_USER=""
    fi
}

# 安装完成后修正文件属主
fix_ownership() {
    if [ -n "${TARGET_USER:-}" ] && [ "$(id -u)" = "0" ]; then
        log "修正文件属主为 $TARGET_USER"
        chown -R "$TARGET_USER:$TARGET_USER" "/home/$TARGET_USER/.local/bin/hermes" 2>/dev/null || true
        chown -R "$TARGET_USER:$TARGET_USER" "/home/$TARGET_USER/.hermes" 2>/dev/null || true
        chown -R "$TARGET_USER:$TARGET_USER" "/home/$TARGET_USER/hermes-agent" 2>/dev/null || true
        chown -R "$TARGET_USER:$TARGET_USER" "/home/$TARGET_USER/.local" 2>/dev/null || true
        ok "文件属主已修正"
    fi
}

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
    # uv 官方安装脚本走 GitHub Releases CDN，国内通常可直连，无需代理
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
    # 如果用户已指定 HM_REPO_URL，直接使用
    if [ -n "${HM_REPO_URL:-}" ]; then
        log "克隆 hermes-agent 仓库：$HM_REPO_URL"
        git clone --recurse-submodules "$HM_REPO_URL" "$target"
        ok "克隆完成：$target"
        return
    fi
    # 国内模式：逐个尝试镜像
    if [ "$HM_USE_CN" = "1" ]; then
        local repo_path="NousResearch/hermes-agent.git"
        for mirror in "${CN_GIT_MIRRORS[@]}"; do
            local url="${mirror}/${repo_path}"
            log "尝试镜像：$url"
            if timeout 120 git clone --recurse-submodules "$url" "$target" 2>&1; then
                ok "克隆完成（镜像：$mirror）"
                return
            fi
            warn "镜像 $mirror 失败，尝试下一个…"
            rm -rf "$target" 2>/dev/null || true
        done
        err "所有镜像均失败，请检查网络或手动克隆仓库到 $target"
        exit 1
    else
        log "克隆 hermes-agent 仓库"
        git clone --recurse-submodules "https://github.com/NousResearch/hermes-agent.git" "$target"
        ok "克隆完成：$target"
    fi
}

install_python_deps() {
    local repo="$HOME/hermes-agent"
    cd "$repo"
    # 确保 uv 在 PATH 中
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
    log "创建虚拟环境 (Python $HM_PYTHON)"
    uv venv venv --python "$HM_PYTHON" --allow-existing
    export VIRTUAL_ENV="$repo/venv"
    log "安装 Python 依赖：[$HM_EXTRAS]"
    # UV_NO_CONFIG=1 完全禁用项目级 uv 配置（exclude-newer 等），
    # 避免清华镜像缺少上传日期导致 python-olm 等包被过滤
    if ! UV_NO_CONFIG=1 uv pip install -e ".[$HM_EXTRAS]"; then
        err "uv pip install 失败，重试一次..."
        UV_NO_CONFIG=1 uv pip install -e ".[$HM_EXTRAS]"
    fi
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
    if [ "$OS" = "linux" ]; then
        setup_target_user
    fi
    install_base_deps
    install_uv
    install_node
    clone_hermes
    install_python_deps
    setup_config_dir
    link_hermes_cli
    run_doctor
    # doctor 运行后再 chown，确保 doctor 新建的日志/缓存文件也属于目标用户
    if [ "$OS" = "linux" ]; then
        fix_ownership
    fi
    ok "全部完成！在新终端执行 hermes 即可开始对话"
}

main "$@"

//! 国内加速镜像常量与切换逻辑

#[derive(Clone, Copy)]
pub struct Mirrors {
    pub use_cn: bool,
}

impl Mirrors {
    pub fn new(use_cn: bool) -> Self {
        Self { use_cn }
    }

    /// GitHub 代理前缀，直接前置到 https://github.com/... 之前
    pub fn github_proxy(&self) -> &'static str {
        if self.use_cn { "https://ghproxy.com/" } else { "" }
    }

    /// GitHub raw 代理
    pub fn raw_github_proxy(&self) -> &'static str {
        if self.use_cn { "https://ghproxy.com/" } else { "" }
    }

    /// PyPI 镜像
    pub fn pypi(&self) -> &'static str {
        if self.use_cn {
            "https://pypi.tuna.tsinghua.edu.cn/simple"
        } else {
            "https://pypi.org/simple"
        }
    }

    /// Homebrew bottle 镜像域名
    pub fn brew_bottle(&self) -> &'static str {
        if self.use_cn {
            "https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles"
        } else {
            "https://ghcr.io/v2/homebrew/core"
        }
    }

    pub fn brew_core_git(&self) -> &'static str {
        if self.use_cn {
            "https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/homebrew-core.git"
        } else {
            "https://github.com/Homebrew/homebrew-core.git"
        }
    }

    pub fn brew_git(&self) -> &'static str {
        if self.use_cn {
            "https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git"
        } else {
            "https://github.com/Homebrew/brew.git"
        }
    }

    /// npm registry
    pub fn npm_registry(&self) -> &'static str {
        if self.use_cn {
            "https://registry.npmmirror.com"
        } else {
            "https://registry.npmjs.org"
        }
    }

    /// Ubuntu rootfs 镜像（WSL 离线导入）
    pub fn ubuntu_rootfs(&self) -> &'static str {
        if self.use_cn {
            "https://mirrors.tuna.tsinghua.edu.cn/ubuntu-cloud-images/wsl/jammy/current/ubuntu-jammy-wsl-amd64-ubuntu.rootfs.tar.gz"
        } else {
            "https://cloud-images.ubuntu.com/wsl/jammy/current/ubuntu-jammy-wsl-amd64-ubuntu.rootfs.tar.gz"
        }
    }
}

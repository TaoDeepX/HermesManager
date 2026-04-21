//! macOS 安装链路（M4 待完善，目前基础框架）

use anyhow::{anyhow, Context, Result};
use std::path::PathBuf;
use tauri::AppHandle;

use crate::install::InstallOptions;
use crate::runner::{emit_log, emit_progress, run_streaming, LogLevel};

const HERMES_SETUP_SH: &str = include_str!("../scripts/hermes_setup.sh");

fn temp_dir() -> PathBuf {
    let mut p = std::env::temp_dir();
    p.push("hermesmanager");
    let _ = std::fs::create_dir_all(&p);
    p
}

fn write_script(name: &str, content: &str) -> Result<PathBuf> {
    let path = temp_dir().join(name);
    std::fs::write(&path, content.replace("\r\n", "\n"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perm = std::fs::metadata(&path)?.permissions();
        perm.set_mode(0o755);
        std::fs::set_permissions(&path, perm)?;
    }
    Ok(path)
}

pub async fn install(app: AppHandle, job_id: &str, opts: &InstallOptions) -> Result<()> {
    emit_progress(&app, job_id, "brew_check", 5, "检查 Homebrew");
    let brew_ok = std::process::Command::new("brew").arg("--version").output().map(|o| o.status.success()).unwrap_or(false);
    if !brew_ok {
        emit_log(&app, job_id, "brew_check", LogLevel::Warn, "未检测到 Homebrew，尝试安装...");
        let cmd = if opts.use_cn {
            // 清华镜像 install script
            r#"export HOMEBREW_BOTTLE_DOMAIN=https://mirrors.tuna.tsinghua.edu.cn/homebrew-bottles; \
               export HOMEBREW_BREW_GIT_REMOTE=https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git; \
               /bin/bash -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)""#
        } else {
            r#"/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)""#
        };
        let code = run_streaming(&app, job_id, "brew_install", "bash", &["-lc", cmd], None).await?;
        if code != 0 {
            return Err(anyhow!("Homebrew 安装失败"));
        }
    }

    emit_progress(&app, job_id, "hermes", 25, "运行 hermes_setup.sh");
    let sh = write_script("hermes_setup.sh", HERMES_SETUP_SH).context("写入脚本失败")?;
    let cn = if opts.use_cn { "1" } else { "0" };
    let cmd = format!("HM_USE_CN={} bash '{}'", cn, sh.to_string_lossy());
    let code = run_streaming(&app, job_id, "hermes", "bash", &["-lc", &cmd], None).await?;
    if code != 0 {
        return Err(anyhow!("HermesAgent 安装失败（退出码 {}）", code));
    }

    Ok(())
}

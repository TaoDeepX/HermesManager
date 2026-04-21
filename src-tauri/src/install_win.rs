//! Windows 安装链路：启用 WSL2 → 确保发行版 → 在 WSL 内运行 hermes_setup.sh

use anyhow::{anyhow, Context, Result};
use std::path::PathBuf;
use tauri::AppHandle;

use crate::install::InstallOptions;
use crate::runner::{emit_log, emit_progress, run_streaming, LogLevel};

const WSL_BOOTSTRAP_PS1: &str = include_str!("../scripts/wsl_bootstrap.ps1");
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
    Ok(path)
}

pub async fn install(app: AppHandle, job_id: &str, opts: &InstallOptions) -> Result<()> {
    // Step 1: WSL 引导
    emit_progress(&app, job_id, "wsl", 5, "启用 WSL2 并确保发行版");
    let ps1 = write_script("wsl_bootstrap.ps1", WSL_BOOTSTRAP_PS1)
        .context("写入 wsl_bootstrap.ps1 失败")?;
    let mut args: Vec<String> = vec![
        "-NoProfile".into(),
        "-ExecutionPolicy".into(),
        "Bypass".into(),
        "-File".into(),
        ps1.to_string_lossy().into_owned(),
    ];
    if opts.use_cn {
        args.push("-UseCN".into());
    }
    let args_ref: Vec<&str> = args.iter().map(String::as_str).collect();
    let code = run_streaming(&app, job_id, "wsl", "powershell.exe", &args_ref, None).await?;
    if code != 0 {
        return Err(anyhow!(
r#"WSL 引导失败（退出码 {}）。

请以【管理员身份】打开 PowerShell，依次执行以下命令：

1. 启用 WSL 和虚拟机功能：
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

2. 重启电脑

3. 重启后再次以管理员身份打开 PowerShell，执行：
   wsl --install -d Ubuntu-22.04
   wsl --set-default-version 2

4. 完成后重新运行 HermesManager"#,
            code
        ));
    }

    // Step 2: 写入 hermes_setup.sh 到 WSL 可访问的临时目录
    emit_progress(&app, job_id, "setup_script", 25, "准备安装脚本");
    let sh = write_script("hermes_setup.sh", HERMES_SETUP_SH)
        .context("写入 hermes_setup.sh 失败")?;
    // Windows 路径 -> WSL 路径：D:\...\hermes_setup.sh -> /mnt/d/.../hermes_setup.sh
    let wsl_path = windows_path_to_wsl(&sh)?;
    emit_log(
        &app,
        job_id,
        "setup_script",
        LogLevel::Info,
        format!("WSL 路径：{}", wsl_path),
    );

    // Step 3: 在 WSL 内执行
    emit_progress(&app, job_id, "hermes", 40, "在 WSL 内安装 HermesAgent");
    let cn = if opts.use_cn { "1" } else { "0" };
    let inner_cmd = format!(
        "export HM_USE_CN={} && chmod +x '{}' && bash '{}'",
        cn, wsl_path, wsl_path
    );
    let code = run_streaming(
        &app,
        job_id,
        "hermes",
        "wsl.exe",
        &["--", "bash", "-lc", &inner_cmd],
        None,
    )
    .await?;
    if code != 0 {
        return Err(anyhow!("HermesAgent 安装失败（退出码 {}）", code));
    }

    // Step 4: 写入 .env（如有）
    if let Some(kv) = &opts.env_kv {
        emit_progress(&app, job_id, "env", 90, "写入 API Key 到 ~/.hermes/.env");
        let mut lines = String::new();
        for (k, v) in kv {
            lines.push_str(&format!("{}={}\n", k, v));
        }
        let env_cmd = format!(
            "mkdir -p ~/.hermes && printf '%s' \"$HM_ENV_CONTENT\" >> ~/.hermes/.env"
        );
        let _ = run_streaming(
            &app,
            job_id,
            "env",
            "wsl.exe",
            &[
                "--",
                "bash",
                "-lc",
                &format!("HM_ENV_CONTENT={} {}", shell_escape(&lines), env_cmd),
            ],
            None,
        )
        .await?;
    }

    Ok(())
}

fn windows_path_to_wsl(p: &std::path::Path) -> Result<String> {
    let s = p.to_string_lossy().replace('\\', "/");
    // D:/... -> /mnt/d/...
    if let Some((drive, rest)) = s.split_once(":/") {
        let letter = drive.chars().next().unwrap_or('c').to_ascii_lowercase();
        Ok(format!("/mnt/{}/{}", letter, rest))
    } else {
        Err(anyhow!("无法解析 Windows 路径为 WSL 路径：{}", s))
    }
}

fn shell_escape(s: &str) -> String {
    let mut out = String::from("'");
    for ch in s.chars() {
        if ch == '\'' {
            out.push_str("'\\''");
        } else {
            out.push(ch);
        }
    }
    out.push('\'');
    out
}

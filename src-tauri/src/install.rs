//! 安装编排：根据平台分发到 install_win / install_mac。
//! 前端通过 `start_install` 命令触发，订阅 `install-log` 和 `install-progress` 事件。

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::runner::{emit_log, emit_progress, LogLevel};

#[derive(Deserialize, Debug, Clone)]
pub struct InstallOptions {
    pub use_cn: bool,
    /// 可选：预先配置的 provider env 写入 ~/.hermes/.env
    pub env_kv: Option<Vec<(String, String)>>,
}

#[derive(Serialize, Debug, Clone)]
pub struct InstallResult {
    pub job_id: String,
    pub ok: bool,
    pub message: String,
}

pub async fn run(app: AppHandle, opts: InstallOptions) -> InstallResult {
    let job_id = uuid::Uuid::new_v4().to_string();
    emit_progress(&app, &job_id, "start", 0, "启动安装任务");

    let outcome = {
        #[cfg(target_os = "windows")]
        {
            crate::install_win::install(app.clone(), &job_id, &opts).await
        }
        #[cfg(target_os = "macos")]
        {
            crate::install_mac::install(app.clone(), &job_id, &opts).await
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            Err(anyhow::anyhow!("unsupported platform"))
        }
    };

    match outcome {
        Ok(_) => {
            emit_progress(&app, &job_id, "done", 100, "全部完成");
            emit_log(&app, &job_id, "done", LogLevel::Ok, "✅ 安装成功");
            InstallResult {
                job_id,
                ok: true,
                message: "安装成功".into(),
            }
        }
        Err(e) => {
            emit_log(&app, &job_id, "done", LogLevel::Err, format!("❌ {}", e));
            InstallResult {
                job_id,
                ok: false,
                message: format!("{}", e),
            }
        }
    }
}

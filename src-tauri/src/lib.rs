mod detect;
mod install;
#[cfg(target_os = "macos")]
mod install_mac;
#[cfg(target_os = "windows")]
mod install_win;
mod mirrors;
mod probe;
mod runner;

#[tauri::command]
fn detect_environment() -> detect::Report {
    detect::run_all()
}

#[tauri::command]
fn doctor_fix(req: detect::FixRequest) -> detect::FixResult {
    detect::fix_check(&req)
}

#[tauri::command]
async fn start_install(app: tauri::AppHandle, opts: install::InstallOptions) -> install::InstallResult {
    install::run(app, opts).await
}

#[tauri::command]
async fn test_provider(req: probe::TestRequest) -> probe::TestResponse {
    probe::test_connection(req).await
}

#[tauri::command]
async fn list_models(req: probe::ListModelsRequest) -> probe::ListModelsResponse {
    probe::list_models(req).await
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    opener::open(&url).map_err(|e| e.to_string())
}

/// 在新终端窗口启动 hermes（小白可直接点按钮启动，无需手动开终端）
/// args: 传给 hermes 的参数，例如 "" / "--tui" / "gateway setup"
#[tauri::command]
fn launch_hermes_terminal(args: String) -> Result<(), String> {
    use std::process::Command;
    let trimmed = args.trim();
    let hermes_cmd = if trimmed.is_empty() {
        "hermes".to_string()
    } else {
        format!("hermes {}", trimmed)
    };

    #[cfg(target_os = "windows")]
    {
        // 优先用 Windows Terminal (wt.exe)，回退到普通 wsl 启动
        let wt_cmd = format!("{} ; read -p '按 Enter 关闭...'", hermes_cmd);
        let wt = Command::new("cmd")
            .args(["/C", "start", "", "wt.exe", "-w", "0", "wsl", "--", "bash", "-lc", &wt_cmd])
            .spawn();
        if wt.is_ok() {
            return Ok(());
        }
        // Fallback: 用 conhost 启动 wsl
        let fallback_cmd = format!("{} ; read -p '按 Enter 关闭...'", hermes_cmd);
        Command::new("cmd")
            .args(["/C", "start", "", "wsl", "--", "bash", "-lc", &fallback_cmd])
            .spawn()
            .map_err(|e| format!("启动 WSL 终端失败：{}", e))?;
        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        // 用 osascript 让 Terminal.app 新开一个窗口运行 hermes
        let script = format!(
            "tell application \"Terminal\" to do script \"{}\"\ntell application \"Terminal\" to activate",
            hermes_cmd.replace('"', "\\\"")
        );
        Command::new("osascript")
            .args(["-e", &script])
            .spawn()
            .map_err(|e| format!("启动 Terminal 失败：{}", e))?;
        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = hermes_cmd;
        Err("当前平台不支持自动打开终端".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            detect_environment,
            doctor_fix,
            start_install,
            test_provider,
            list_models,
            open_external,
            launch_hermes_terminal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

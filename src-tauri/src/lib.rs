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
        // 用 Windows Terminal 打开新标签页运行 hermes
        // 注意：wt.exe 参数用 -- 分隔，避免解析问题
        let bash_cmd = format!("{} ; echo ''; read -p '按 Enter 关闭...'", hermes_cmd);
        Command::new("wt.exe")
            .args(["wsl", "--", "bash", "-lc", &bash_cmd])
            .spawn()
            .map_err(|e| format!("启动 Windows Terminal 失败：{}", e))?;
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

/// 完全卸载 HermesAgent（删除源码、配置、CLI）
#[tauri::command]
fn uninstall_hermes() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // WSL 内删除：写临时脚本文件避免 wsl.exe 吞 $ 变量
        let script = r#"#!/bin/bash
for home_dir in /home/*/; do
    rm -rf "${home_dir}hermes-agent" 2>/dev/null
    rm -rf "${home_dir}.hermes" 2>/dev/null
    rm -f "${home_dir}.local/bin/hermes" 2>/dev/null
done
rm -rf /root/hermes-agent 2>/dev/null
rm -rf /root/.hermes 2>/dev/null
rm -f /root/.local/bin/hermes 2>/dev/null
echo "HermesAgent 已完全删除"
"#;
        let tmp = std::env::temp_dir().join("hermes_uninstall.sh");
        std::fs::write(&tmp, script).map_err(|e| format!("写入卸载脚本失败：{}", e))?;
        // Windows 路径转 WSL 路径
        let drive = tmp.to_string_lossy().chars().next().unwrap_or('C');
        let rest = tmp.to_string_lossy()[3..].replace('\\', "/");
        let wsl_path = format!("/mnt/{}/{}", drive.to_ascii_lowercase(), rest);
        let output = std::process::Command::new("wsl")
            .args(["-u", "root", "--", "bash", &wsl_path])
            .output()
            .map_err(|e| format!("执行删除命令失败：{}", e))?;
        let _ = std::fs::remove_file(&tmp);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !output.status.success() {
            return Err(format!("删除失败：{}\n{}", stdout, stderr));
        }
        Ok(stdout.trim().to_string())
    }
    #[cfg(target_os = "macos")]
    {
        let home = std::env::var("HOME").unwrap_or_else(|_| "~".to_string());
        let paths = [
            format!("{}/hermes-agent", home),
            format!("{}/.hermes", home),
            format!("{}/.local/bin/hermes", home),
        ];
        for p in &paths {
            let _ = std::fs::remove_dir_all(p);
            let _ = std::fs::remove_file(p);
        }
        Ok("HermesAgent 已完全删除".to_string())
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("当前平台不支持".into())
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
            launch_hermes_terminal,
            uninstall_hermes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

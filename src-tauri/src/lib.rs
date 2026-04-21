mod detect;
mod install;
#[cfg(target_os = "macos")]
mod install_mac;
#[cfg(target_os = "windows")]
mod install_win;
mod mirrors;
mod runner;

#[tauri::command]
fn detect_environment() -> detect::Report {
    detect::run_all()
}

#[tauri::command]
async fn start_install(app: tauri::AppHandle, opts: install::InstallOptions) -> install::InstallResult {
    install::run(app, opts).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![detect_environment, start_install])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

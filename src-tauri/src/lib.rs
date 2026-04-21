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
async fn start_install(app: tauri::AppHandle, opts: install::InstallOptions) -> install::InstallResult {
    install::run(app, opts).await
}

#[tauri::command]
async fn test_provider(req: probe::TestRequest) -> probe::TestResponse {
    probe::test_connection(req).await
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    opener::open(&url).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            detect_environment,
            start_install,
            test_provider,
            open_external
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod detect;

#[tauri::command]
fn detect_environment() -> detect::Report {
    detect::run_all()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![detect_environment])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod structures;
mod wifi_functions;

use wifi_functions::{
    connect_wifi, disconnect_wifi, get_active_network, scan_wifi,
    // Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)
    // get_monitoring_status, start_monitoring, stop_monitoring,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_wifi,
            connect_wifi,
            get_active_network,
            disconnect_wifi,
            // Real-time monitoring feature - COMMENTED OUT (will be re-enabled in future)
            // start_monitoring,
            // stop_monitoring,
            // get_monitoring_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}


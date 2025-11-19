mod structures;
mod wifi_functions;

use wifi_functions::{
    connect_wifi, disconnect_wifi, get_active_network, get_monitoring_status, scan_wifi,
    start_monitoring, stop_monitoring,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            scan_wifi,
            connect_wifi,
            get_active_network,
            disconnect_wifi,
            start_monitoring,
            stop_monitoring,
            get_monitoring_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}


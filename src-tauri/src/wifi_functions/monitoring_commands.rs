// use crate::wifi_functions::{MonitorConfig, MonitorHandle};
// use std::sync::Arc;
// use tauri::AppHandle;

// // Global monitoring handle
// lazy_static::lazy_static! {
//     static ref MONITOR_HANDLE: Arc<MonitorHandle> = Arc::new(MonitorHandle::new());
// }

// fn get_monitor_handle() -> Arc<MonitorHandle> {
//     MONITOR_HANDLE.clone()
// }

// #[tauri::command]
// pub async fn start_monitoring(
//     app: AppHandle,
//     serverUrl: String,
//     authToken: String,
//     intervalSeconds: u64,
//     enabledThreatTypes: Vec<String>,
//     whitelist: Vec<String>,
//     blacklist: Vec<String>,
// ) -> Result<String, String> {
//     let handle = get_monitor_handle();
    
//     // Check if already running
//     if handle.is_running().await {
//         return Err("Monitoring is already running".to_string());
//     }

//     let config = MonitorConfig {
//         server_url: serverUrl,
//         auth_token: authToken,
//         interval_seconds: intervalSeconds,
//         enabled_threat_types: enabledThreatTypes.into_iter().collect(),
//         app_handle: Some(app),
//     };

//     handle.start(config, whitelist, blacklist).await;

//     Ok("Monitoring started successfully".to_string())
// }

// #[tauri::command]
// pub async fn stop_monitoring() -> Result<String, String> {
//     let handle = get_monitor_handle();
    
//     if !handle.is_running().await {
//         return Err("Monitoring is not running".to_string());
//     }

//     handle.stop().await;

//     Ok("Monitoring stopped successfully".to_string())
// }

// #[tauri::command]
// pub async fn get_monitoring_status() -> Result<bool, String> {
//     let handle = get_monitor_handle();
//     Ok(handle.is_running().await)
// }


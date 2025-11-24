// use crate::structures::{DetectedThreat, MonitoringState};
// use crate::wifi_functions::{detect_threats, scan_wifi};
// use std::collections::HashSet;
// use std::sync::Arc;
// use tokio::sync::Mutex;
// use tokio::time::{interval, Duration};
// use tauri::{AppHandle, Emitter};

// pub struct MonitorConfig {
//     pub server_url: String,
//     pub auth_token: String,
//     pub interval_seconds: u64,
//     pub enabled_threat_types: HashSet<String>,
//     pub app_handle: Option<AppHandle>,
// }

// pub struct MonitorHandle {
//     pub is_running: Arc<Mutex<bool>>,
//     pub state: Arc<Mutex<MonitoringState>>,
// }

// impl MonitorHandle {
//     pub fn new() -> Self {
//         Self {
//             is_running: Arc::new(Mutex::new(false)),
//             state: Arc::new(Mutex::new(MonitoringState::default())),
//         }
//     }

//     pub async fn start(&self, config: MonitorConfig, whitelist: Vec<String>, blacklist: Vec<String>) {
//         let mut running = self.is_running.lock().await;
//         if *running {
//             return; // Already running
//         }
//         *running = true;
//         drop(running);

//         let is_running = Arc::clone(&self.is_running);
//         let state = Arc::clone(&self.state);
//         let whitelist_set: HashSet<String> = whitelist.iter().map(|s| s.to_lowercase()).collect();
//         let blacklist_set: HashSet<String> = blacklist.iter().map(|s| s.to_lowercase()).collect();
//         let app_handle = config.app_handle.clone();

//         tokio::spawn(async move {
//             let mut interval = interval(Duration::from_secs(config.interval_seconds));
//             let client = reqwest::Client::new();

//             loop {
//                 // Check if monitoring is still enabled
//                 let running = is_running.lock().await;
//                 if !*running {
//                     break;
//                 }
//                 drop(running);

//                 interval.tick().await;

//                 // Perform scan and detect threats (run in blocking thread since scan_wifi is blocking)
//                 let networks = tokio::task::spawn_blocking(|| {
//                     scan_wifi()
//                 }).await;

//                 match networks {
//                     Ok(networks) => {
//                         let mut state_guard = state.lock().await;
//                         let threats = detect_threats(
//                             &networks,
//                             &mut *state_guard,
//                             &whitelist_set,
//                             &blacklist_set,
//                         );

//                         // Filter threats by enabled types
//                         let filtered_threats: Vec<DetectedThreat> = threats
//                             .into_iter()
//                             .filter(|t| {
//                                 config.enabled_threat_types.is_empty()
//                                     || config.enabled_threat_types.contains(&t.threat_type)
//                             })
//                             .collect();

//                         // Send threats to server and emit Tauri events
//                         for threat in filtered_threats {
//                             // Send to server
//                             send_threat_to_server(&client, &config.server_url, &config.auth_token, &threat).await;
                            
//                             // Emit Tauri event if app handle is available
//                             if let Some(ref app) = app_handle {
//                                 let _ = app.emit(
//                                     "threat-detected",
//                                     serde_json::json!({
//                                         "threat_type": threat.threat_type,
//                                         "severity": threat.severity,
//                                         "network_ssid": threat.network_ssid,
//                                         "network_bssid": threat.network_bssid,
//                                         "details": threat.details,
//                                     })
//                                 );
//                             }
//                         }
//                     }
//                     Err(e) => {
//                         eprintln!("Error during monitoring scan: {}", e);
//                     }
//                 }
//             }
//         });
//     }

//     pub async fn stop(&self) {
//         let mut running = self.is_running.lock().await;
//         *running = false;
//     }

//     pub async fn is_running(&self) -> bool {
//         let running = self.is_running.lock().await;
//         *running
//     }
// }

// async fn send_threat_to_server(
//     client: &reqwest::Client,
//     server_url: &str,
//     auth_token: &str,
//     threat: &DetectedThreat,
// ) {
//     let url = format!("{}/threats/alert", server_url.trim_end_matches('/'));

//     let payload = serde_json::json!({
//         "threat_type": threat.threat_type,
//         "severity": threat.severity,
//         "network_ssid": threat.network_ssid,
//         "network_bssid": threat.network_bssid,
//         "details": threat.details,
//         "timestamp": threat.timestamp.to_rfc3339(),
//     });

//     let response = client
//         .post(&url)
//         .header("Authorization", format!("Bearer {}", auth_token))
//         .header("Content-Type", "application/json")
//         .json(&payload)
//         .send()
//         .await;

//     match response {
//         Ok(res) => {
//             if res.status().is_success() {
//                 println!("Threat alert sent successfully: {}", threat.threat_type);
//             } else {
//                 eprintln!("Failed to send threat alert: HTTP {}", res.status());
//             }
//         }
//         Err(e) => {
//             eprintln!("Error sending threat alert to server: {}", e);
//         }
//     }
// }


use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DetectedThreat {
    pub threat_type: String,
    pub severity: String,
    pub network_ssid: String,
    pub network_bssid: String,
    pub details: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NetworkHistory {
    pub ssid: String,
    pub bssid: String,
    pub signal_strength: i32,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub appearance_count: u32,
    pub previous_signals: Vec<i32>,
}

#[derive(Debug, Clone)]
pub struct MonitoringState {
    pub previous_networks: Vec<crate::structures::WifiNetwork>,
    pub network_history: std::collections::HashMap<String, NetworkHistory>,
    pub connection_failures: Vec<ConnectionFailure>,
    pub signal_baselines: std::collections::HashMap<String, Vec<i32>>,
    pub scan_count: u64,
    pub last_scan_time: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct ConnectionFailure {
    pub network_ssid: String,
    pub network_bssid: String,
    pub timestamp: DateTime<Utc>,
    pub reason: String,
}

impl Default for MonitoringState {
    fn default() -> Self {
        Self {
            previous_networks: Vec::new(),
            network_history: std::collections::HashMap::new(),
            connection_failures: Vec::new(),
            signal_baselines: std::collections::HashMap::new(),
            scan_count: 0,
            last_scan_time: None,
        }
    }
}


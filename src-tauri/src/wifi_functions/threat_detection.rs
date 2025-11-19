use crate::structures::{DetectedThreat, MonitoringState, WifiNetwork};
use chrono::Utc;
use std::collections::{HashMap, HashSet};

pub fn detect_threats(
    current_networks: &[WifiNetwork],
    state: &mut MonitoringState,
    whitelist_bssids: &HashSet<String>,
    blacklist_bssids: &HashSet<String>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();
    let now = Utc::now();

    // Update network history
    update_network_history(current_networks, state, now);

    // 1. MAC Spoofing Detection
    threats.extend(detect_mac_spoofing(current_networks, state, now));

    // 2. Deauth Attack Detection
    threats.extend(detect_deauth_attacks(state, now));

    // 3. Flood Attack Detection
    threats.extend(detect_flood_attacks(state, current_networks, now));

    // 4. Unauthorized Client Association
    threats.extend(detect_unauthorized_clients(current_networks, whitelist_bssids, now));

    // 5. Probe Request Anomalies
    threats.extend(detect_probe_anomalies(current_networks, state, now));

    // 6. RF Jamming Detection
    threats.extend(detect_rf_jamming(current_networks, state, now));

    // 7. Blacklist Detection
    threats.extend(detect_blacklisted_networks(current_networks, blacklist_bssids, now));

    // Update state
    state.previous_networks = current_networks.to_vec();
    state.scan_count += 1;
    state.last_scan_time = Some(now);

    // Clean up old connection failures (older than 1 minute)
    let one_minute_ago = now - chrono::Duration::seconds(60);
    state.connection_failures.retain(|f| f.timestamp > one_minute_ago);

    threats
}

fn update_network_history(
    networks: &[WifiNetwork],
    state: &mut MonitoringState,
    now: chrono::DateTime<Utc>,
) {
    for network in networks {
        let bssid = network.bssid.clone().to_lowercase();
        let signal_str = network.signal.trim_end_matches('%');
        let signal_strength = signal_str.parse::<i32>().unwrap_or(0);

        let history = state
            .network_history
            .entry(bssid.clone())
            .or_insert_with(|| crate::structures::NetworkHistory {
                ssid: network.ssid.clone(),
                bssid: bssid.clone(),
                signal_strength,
                first_seen: now,
                last_seen: now,
                appearance_count: 0,
                previous_signals: Vec::new(),
            });

        history.last_seen = now;
        history.appearance_count += 1;
        history.signal_strength = signal_strength;
        history.ssid = network.ssid.clone();

        // Update signal baseline (keep last 10 measurements)
        let baseline = state
            .signal_baselines
            .entry(bssid.clone())
            .or_insert_with(Vec::new);
        baseline.push(signal_strength);
        if baseline.len() > 10 {
            baseline.remove(0);
        }

        // Keep last 10 signals in history
        history.previous_signals.push(signal_strength);
        if history.previous_signals.len() > 10 {
            history.previous_signals.remove(0);
        }
    }

    // Clean up old network history (not seen in last 5 minutes)
    let five_minutes_ago = now - chrono::Duration::minutes(5);
    state
        .network_history
        .retain(|_, history| history.last_seen > five_minutes_ago);
}

fn detect_mac_spoofing(
    networks: &[WifiNetwork],
    state: &MonitoringState,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();
    let mut bssid_to_ssids: HashMap<String, HashSet<String>> = HashMap::new();
    let mut ssid_to_bssids: HashMap<String, HashSet<String>> = HashMap::new();

    // Build mappings
    for network in networks {
        let bssid = network.bssid.clone().to_lowercase();
        let ssid = network.ssid.clone();

        if !ssid.trim().is_empty() && !bssid.trim().is_empty() {
            bssid_to_ssids
                .entry(bssid.clone())
                .or_insert_with(HashSet::new)
                .insert(ssid.clone());

            ssid_to_bssids
                .entry(ssid)
                .or_insert_with(HashSet::new)
                .insert(bssid);
        }
    }

    // Detect same BSSID with different SSIDs
    for (bssid, ssids) in bssid_to_ssids {
        if ssids.len() > 1 {
            threats.push(DetectedThreat {
                threat_type: "mac_spoof".to_string(),
                severity: "Critical".to_string(),
                network_ssid: ssids.iter().next().unwrap_or(&"Unknown".to_string()).clone(),
                network_bssid: bssid.clone(),
                details: format!(
                    "BSSID {} appears with multiple SSIDs: {}",
                    bssid,
                    ssids.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(", ")
                ),
                timestamp: now,
            });
        }
    }

    // Detect same SSID with rapidly changing BSSIDs (more than 3 different BSSIDs)
    for (ssid, bssids) in ssid_to_bssids {
        if bssids.len() > 3 {
            threats.push(DetectedThreat {
                threat_type: "mac_spoof".to_string(),
                severity: "High".to_string(),
                network_ssid: ssid.clone(),
                network_bssid: bssids.iter().next().unwrap_or(&"Unknown".to_string()).clone(),
                details: format!(
                    "SSID {} has {} different BSSIDs, possible MAC spoofing attack",
                    ssid,
                    bssids.len()
                ),
                timestamp: now,
            });
        }
    }

    threats
}

fn detect_deauth_attacks(
    state: &MonitoringState,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();
    let thirty_seconds_ago = now - chrono::Duration::seconds(30);

    // Count failures per network in last 30 seconds
    let mut failures_per_network: HashMap<String, u32> = HashMap::new();

    for failure in &state.connection_failures {
        if failure.timestamp > thirty_seconds_ago {
            let key = format!("{}:{}", failure.network_ssid, failure.network_bssid);
            *failures_per_network.entry(key).or_insert(0) += 1;
        }
    }

    // Alert if >3 failures in 30 seconds
    for (network_key, count) in failures_per_network {
        if count > 3 {
            let parts: Vec<&str> = network_key.split(':').collect();
            threats.push(DetectedThreat {
                threat_type: "deauth_attack".to_string(),
                severity: "High".to_string(),
                network_ssid: parts.get(0).unwrap_or(&"Unknown").to_string(),
                network_bssid: parts.get(1).unwrap_or(&"Unknown").to_string(),
                details: format!(
                    "Rapid connection failures detected ({} failures in 30 seconds), possible deauthentication attack",
                    count
                ),
                timestamp: now,
            });
        }
    }

    threats
}

fn detect_flood_attacks(
    state: &MonitoringState,
    current_networks: &[WifiNetwork],
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();

    if state.previous_networks.is_empty() {
        return threats;
    }

    // Get BSSIDs from previous and current scans
    let prev_bssids: HashSet<String> = state
        .previous_networks
        .iter()
        .map(|n| n.bssid.clone().to_lowercase())
        .collect();

    let curr_bssids: HashSet<String> = current_networks
        .iter()
        .map(|n| n.bssid.clone().to_lowercase())
        .collect();

    // Detect rapid appearance of new networks (>10 in one scan)
    let new_networks: Vec<_> = curr_bssids
        .difference(&prev_bssids)
        .cloned()
        .collect();

    if new_networks.len() > 10 {
        threats.push(DetectedThreat {
            threat_type: "flood_attack".to_string(),
            severity: "High".to_string(),
            network_ssid: "Multiple".to_string(),
            network_bssid: "Multiple".to_string(),
            details: format!(
                "Rapid network appearance detected: {} new networks appeared in single scan, possible flood attack",
                new_networks.len()
            ),
            timestamp: now,
        });
    }

    // Detect rapid disappearance (>10 networks disappeared)
    let disappeared_networks: Vec<_> = prev_bssids
        .difference(&curr_bssids)
        .cloned()
        .collect();

    if disappeared_networks.len() > 10 {
        threats.push(DetectedThreat {
            threat_type: "flood_attack".to_string(),
            severity: "Medium".to_string(),
            network_ssid: "Multiple".to_string(),
            network_bssid: "Multiple".to_string(),
            details: format!(
                "Rapid network disappearance detected: {} networks disappeared in single scan",
                disappeared_networks.len()
            ),
            timestamp: now,
        });
    }

    threats
}

fn detect_unauthorized_clients(
    networks: &[WifiNetwork],
    whitelist_bssids: &HashSet<String>,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();

    // Check if user has whitelist enabled and has entries
    if whitelist_bssids.is_empty() {
        return threats;
    }

    for network in networks {
        let bssid = network.bssid.clone().to_lowercase();

        // If network is not in whitelist, it's unauthorized
        if !whitelist_bssids.contains(&bssid) {
            threats.push(DetectedThreat {
                threat_type: "unauthorized_client".to_string(),
                severity: "Medium".to_string(),
                network_ssid: network.ssid.clone(),
                network_bssid: bssid.clone(),
                details: format!(
                    "Unauthorized network detected: {} (BSSID: {}) not in whitelist",
                    network.ssid, bssid
                ),
                timestamp: now,
            });
        }
    }

    threats
}

fn detect_probe_anomalies(
    networks: &[WifiNetwork],
    _state: &MonitoringState,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();

    // Count empty/hidden SSIDs (broadcast SSIDs)
    let hidden_count = networks
        .iter()
        .filter(|n| n.ssid.trim().is_empty() || n.ssid == "-")
        .count();

    // Alert if many hidden networks (>5 in one scan)
    if hidden_count > 5 {
        threats.push(DetectedThreat {
            threat_type: "probe_anomaly".to_string(),
            severity: "Medium".to_string(),
            network_ssid: "Hidden".to_string(),
            network_bssid: "Multiple".to_string(),
            details: format!(
                "Excessive hidden network probes detected: {} hidden networks, possible probe flood",
                hidden_count
            ),
            timestamp: now,
        });
    }

    threats
}

fn detect_rf_jamming(
    networks: &[WifiNetwork],
    state: &MonitoringState,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();
    let mut networks_with_drops = 0;

    for network in networks {
        let bssid = network.bssid.clone().to_lowercase();
        let signal_str = network.signal.trim_end_matches('%');
        let current_signal = signal_str.parse::<i32>().unwrap_or(0);

        // Check if we have baseline for this network
        if let Some(baseline) = state.signal_baselines.get(&bssid) {
            if baseline.len() >= 3 {
                // Calculate average baseline (excluding current signal)
                let avg_baseline: i32 = baseline.iter().sum::<i32>() / baseline.len() as i32;

                // Detect sudden signal drop (>50% decrease)
                if avg_baseline > 0 && current_signal < (avg_baseline / 2) {
                    networks_with_drops += 1;

                    threats.push(DetectedThreat {
                        threat_type: "rf_jamming".to_string(),
                        severity: "High".to_string(),
                        network_ssid: network.ssid.clone(),
                        network_bssid: bssid.clone(),
                        details: format!(
                            "Sudden signal strength drop detected: {}% -> {}% ({}% decrease), possible RF jamming",
                            avg_baseline,
                            current_signal,
                            ((avg_baseline - current_signal) * 100) / avg_baseline
                        ),
                        timestamp: now,
                    });
                }
            }
        }
    }

    // Alert if multiple networks show simultaneous signal drops (>3 networks)
    if networks_with_drops > 3 {
        threats.push(DetectedThreat {
            threat_type: "rf_jamming".to_string(),
            severity: "Critical".to_string(),
            network_ssid: "Multiple".to_string(),
            network_bssid: "Multiple".to_string(),
            details: format!(
                "Multiple networks ({}) showing simultaneous signal drops, likely RF jamming attack",
                networks_with_drops
            ),
            timestamp: now,
        });
    }

    threats
}

fn detect_blacklisted_networks(
    networks: &[WifiNetwork],
    blacklist_bssids: &HashSet<String>,
    now: chrono::DateTime<Utc>,
) -> Vec<DetectedThreat> {
    let mut threats = Vec::new();

    for network in networks {
        let bssid = network.bssid.clone().to_lowercase();

        if blacklist_bssids.contains(&bssid) {
            threats.push(DetectedThreat {
                threat_type: "blacklisted_network".to_string(),
                severity: "Critical".to_string(),
                network_ssid: network.ssid.clone(),
                network_bssid: bssid.clone(),
                details: format!(
                    "Blacklisted network detected: {} (BSSID: {}), avoid connecting",
                    network.ssid, bssid
                ),
                timestamp: now,
            });
        }
    }

    threats
}

// Helper function to record connection failure (called from monitoring task)
pub fn record_connection_failure(
    state: &mut MonitoringState,
    network_ssid: String,
    network_bssid: String,
    reason: String,
) {
    state.connection_failures.push(crate::structures::ConnectionFailure {
        network_ssid,
        network_bssid,
        timestamp: Utc::now(),
        reason,
    });
}


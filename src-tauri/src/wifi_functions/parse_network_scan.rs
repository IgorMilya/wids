use crate::structures::WifiNetwork;
use crate::wifi_functions::calculate_risk::calculate_risk;

pub fn parse_network_scan(output: &str) -> Vec<WifiNetwork> {
    let mut networks = Vec::new();

    let mut current_ssid = String::new();
    let mut current_auth = String::new();
    let mut current_encryption = String::new();
    let mut current_bssid: Option<WifiNetwork> = None;

    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("SSID") && trimmed.contains(":") {
            if let Some(network) = current_bssid.take() {
                networks.push(network);
            }
            
            let ssid_part = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
            
            if !ssid_part.is_empty() {
                current_ssid = ssid_part;
                current_auth = String::new();
                current_encryption = String::new();
            }
        } else if trimmed.starts_with("Authentication") && trimmed.contains(":") {
            current_auth = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("Encryption") && trimmed.contains(":") {
            current_encryption = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("BSSID") && trimmed.contains(":") {
            if let Some(network) = current_bssid.take() {
                networks.push(network);
            }

            let bssid = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
            
            if !current_ssid.is_empty() && !bssid.is_empty() {
                current_bssid = Some(WifiNetwork {
                    ssid: current_ssid.clone(),
                    authentication: current_auth.clone(),
                    encryption: current_encryption.clone(),
                    bssid,
                    signal: String::new(),
                    risk: String::new(),
                    is_evil_twin: false,
                });
            }
        } else if trimmed.starts_with("Signal") && trimmed.contains(":") {
            if let Some(network) = current_bssid.as_mut() {
                network.signal = trimmed
                    .splitn(2, ':')
                    .nth(1)
                    .unwrap_or("")
                    .trim()
                    .to_string();
            }
        }
    }

    if let Some(network) = current_bssid {
        networks.push(network);
    }

    for net in networks.iter_mut() {
        net.risk = calculate_risk(&net.authentication, &net.encryption, &net.signal, &net.ssid);
    }

    networks
}

use crate::structures::WifiNetwork;
use crate::wifi_functions::calculate_risk::calculate_risk;

pub fn parse_active_interface(output: &str) -> Vec<WifiNetwork> {
    let mut ssid = String::new();
    let mut bssid = String::new();
    let mut auth = String::new();
    let mut encryption = String::new();
    let mut signal = String::new();

    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("SSID") && trimmed.contains(":") {
            ssid = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("AP BSSID") {
            bssid = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("Authentication") {
            auth = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("Cipher") {
            encryption = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        } else if trimmed.starts_with("Signal") {
            signal = trimmed
                .splitn(2, ':')
                .nth(1)
                .unwrap_or("")
                .trim()
                .to_string();
        }
    }

    let risk = calculate_risk(&auth, &encryption, &signal, &ssid);
    vec![WifiNetwork {
        ssid,
        authentication: auth,
        encryption,
        bssid,
        signal,
        risk,
        is_evil_twin: false,
    }]
}

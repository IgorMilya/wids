use crate::structures::WifiNetwork;
use crate::wifi_functions::trigger_scan::trigger_scan;
use crate::wifi_functions::{
    evil_twin_detection::mark_evil_twins, parse_network_scan::parse_network_scan,
};
use std::{process::Command, thread, time::Duration};

#[tauri::command]
pub fn scan_wifi() -> Result<Vec<WifiNetwork>, String> {
    // Check WiFi adapter state first
    let interface_output = Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .output()
        .map_err(|e| format!("Failed to check WiFi adapter state: {}", e))?;

    let interface_result = String::from_utf8_lossy(&interface_output.stdout);
    
    // Check if WiFi adapter is enabled
    let mut has_interface = false;
    let mut radio_software_off = false;
    
    let lines: Vec<&str> = interface_result.lines().collect();
    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        
        // Check for interface state
        if trimmed.starts_with("State") {
            has_interface = true;
        }
        
        // Check for radio status - the next line(s) after "Radio status" contain the status
        if trimmed.contains("Radio status") {
            // Check the next few lines for "Software Off"
            for j in (i + 1)..std::cmp::min(i + 5, lines.len()) {
                if lines[j].contains("Software Off") {
                    radio_software_off = true;
                    break;
                }
            }
        }
        
        // Also check if the line itself contains Software Off
        if trimmed.contains("Software Off") {
            radio_software_off = true;
        }
    }
    
    if !has_interface {
        return Err("No WiFi adapter found. Please ensure your WiFi adapter is installed and enabled.".to_string());
    }
    
    if radio_software_off {
        return Err("WiFi adapter is turned off. Please enable WiFi in Windows Settings or use the WiFi toggle in the system tray.".to_string());
    }

    // Try to trigger scan
    trigger_scan();
    thread::sleep(Duration::from_secs(2));

    let output = Command::new("netsh")
        .args(["wlan", "show", "networks", "mode=bssid"])
        .output()
        .map_err(|e| format!("Failed to scan WiFi networks: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout);
    println!("{}", result);
    
    // Check if the output indicates an error
    if result.contains("The wireless local area network interface is powered down") {
        return Err("WiFi adapter is powered down. Please enable WiFi in Windows Settings.".to_string());
    }
    
    if result.contains("doesn't support the requested operation") {
        return Err("WiFi adapter is not ready for scanning. Please enable WiFi in Windows Settings.".to_string());
    }
    
    let mut networks = parse_network_scan(&result);
    mark_evil_twins(&mut networks);

    Ok(networks)
}

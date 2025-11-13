use crate::structures::WifiNetwork;
use crate::wifi_functions::parse_active_interface::parse_active_interface;
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct ActiveNetwork {
    ssid: String,
    bssid: String,
    signal: String,
    state: String,
}
#[tauri::command]
pub fn get_active_network() -> Vec<WifiNetwork> {
    let output = Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .output()
        .expect("Failed to execute command");

    let result = String::from_utf8_lossy(&output.stdout);
    println!("{}", result);
    let res = parse_active_interface(&result);
    res
}

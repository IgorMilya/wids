use crate::structures::WifiNetwork;
use crate::wifi_functions::trigger_scan::trigger_scan;
use crate::wifi_functions::{
    evil_twin_detection::mark_evil_twins, parse_network_scan::parse_network_scan,
};
use std::{process::Command, thread, time::Duration};

#[tauri::command]
pub fn scan_wifi() -> Vec<WifiNetwork> {
    trigger_scan();
    thread::sleep(Duration::from_secs(2));

    let output = Command::new("netsh")
        .args(["wlan", "show", "networks", "mode=bssid"])
        .output()
        .expect("Failed to execute command");

    let result = String::from_utf8_lossy(&output.stdout);
    println!("{}", result);
    let mut networks = parse_network_scan(&result);
    mark_evil_twins(&mut networks);

    networks
}

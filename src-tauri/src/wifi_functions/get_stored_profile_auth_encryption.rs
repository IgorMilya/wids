use std::process::Command;

pub fn get_stored_profile_auth_encryption(ssid: &str) -> Result<(String, String), String> {
    let output = Command::new("netsh")
        .args([
            "wlan",
            "show",
            "profile",
            &format!("name={}", ssid),
            "key=clear",
        ])
        .output()
        .map_err(|e| format!("Failed to read profile details: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Failed to fetch profile '{}': {}",
            ssid,
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let output_str = String::from_utf8_lossy(&output.stdout);

    let mut auth = None;
    let mut encryption = None;

    for line in output_str.lines() {
        if line.trim_start().starts_with("Authentication") {
            if let Some(value) = line.splitn(2, ':').nth(1) {
                auth = Some(value.trim().to_string());
            }
        } else if line.trim_start().starts_with("Cipher") {
            if let Some(value) = line.splitn(2, ':').nth(1) {
                encryption = Some(value.trim().to_string());
            }
        }

        if auth.is_some() && encryption.is_some() {
            break;
        }
    }

    match (auth, encryption) {
        (Some(a), Some(e)) => Ok((a, e)),
        _ => Err("Failed to parse authentication or encryption from stored profile".to_string()),
    }
}

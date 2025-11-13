use crate::wifi_functions::get_stored_profile_auth_encryption::get_stored_profile_auth_encryption;
use std::fs::File;
use std::io::Write;
use std::process::Command;
use std::thread;
use std::time::Duration;

#[tauri::command]
pub fn connect_wifi(
    ssid: String,
    password: Option<String>,
    authentication: Option<String>,
) -> Result<String, String> {
    let is_open = authentication.as_deref() == Some("Open");

    let known_profiles_output = Command::new("netsh")
        .args(["wlan", "show", "profiles"])
        .output()
        .map_err(|e| format!("Failed to get profiles: {}", e))?;

    let known_profiles = String::from_utf8_lossy(&known_profiles_output.stdout);
    let is_known = known_profiles
        .lines()
        .any(|line| line.trim().starts_with("All User Profile") && line.contains(&ssid));

    if is_known {
        match get_stored_profile_auth_encryption(&ssid) {
            Ok((stored_auth, stored_encryption)) => {
                let current_auth = authentication.clone().unwrap_or_default();
                let current_encryption = if is_open {
                    "none".to_string()
                } else {
                    "AES".to_string()
                };

                let mismatch = !stored_auth.eq_ignore_ascii_case(&current_auth);

                if mismatch {
                    println!(
                        "Profile mismatch detected. Stored: [{}, {}], Current: [{}, {}]. Deleting profile to recreate.",
                        stored_auth, stored_encryption, current_auth, current_encryption
                    );
                    let _ = Command::new("netsh")
                        .args(["wlan", "delete", "profile", &format!("name={}", ssid)])
                        .output();
                } else {
                    let attempt = try_connect(&ssid)?;
                    if attempt.success {
                        return Ok(format!("Successfully connected to known network: {}", ssid));
                    }

                    if password.is_none() && !is_open {
                        return Err(format!(
                            "Connection to saved network '{}' failed. Password may have changed.",
                            ssid
                        ));
                    }
                }
            }
            Err(err) => {
                println!(
                    "Failed to get stored profile details for '{}': {}. Deleting profile as fallback.",
                    ssid, err
                );
                let _ = Command::new("netsh")
                    .args(["wlan", "delete", "profile", &format!("name={}", ssid)])
                    .output();
            }
        }
    }

    let profile = if is_open {
        generate_open_profile_xml(&ssid)
    } else {
        let pass =
            password.ok_or_else(|| "Password is required for secured networks.".to_string())?;
        generate_profile_xml(&ssid, &pass)
    };

    let path = std::env::temp_dir().join("wifi_profile.xml");

    let mut file = File::create(&path).map_err(|e| format!("Failed to create XML file: {}", e))?;
    file.write_all(profile.as_bytes())
        .map_err(|e| format!("Failed to write XML: {}", e))?;

    if is_known {
        let _ = Command::new("netsh")
            .args(["wlan", "delete", "profile", &format!("name={}", ssid)])
            .output();
    }

    let add_output = Command::new("netsh")
        .args([
            "wlan",
            "add",
            "profile",
            &format!("filename={}", path.display()),
        ])
        .output()
        .map_err(|e| format!("Failed to add profile: {}", e))?;

    if !add_output.status.success() {
        return Err(format!(
            "Failed to add profile: {}",
            String::from_utf8_lossy(&add_output.stderr)
        ));
    }

    let connect = try_connect(&ssid)?;
    if connect.success {
        Ok(format!("Connected successfully to '{}'", ssid))
    } else {
        Err(format!(
            "Failed to connect to '{}': {}",
            ssid,
            connect.error.unwrap_or_else(|| "Unknown error".to_string())
        ))
    }
}

fn try_connect(ssid: &str) -> Result<ConnectResult, String> {
    Command::new("netsh")
        .args(["wlan", "connect", &format!("name={}", ssid.trim())])
        .output()
        .map_err(|e| format!("Failed to execute netsh connect: {}", e))?;

    thread::sleep(Duration::from_secs(5));

    let status_output = Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .output()
        .map_err(|e| format!("Failed to check current Wi-Fi connection: {}", e))?;

    let status_str = String::from_utf8_lossy(&status_output.stdout).to_string();

    let mut state_connected = false;
    let mut ssid_matched = false;

    for line in status_str.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("State") {
            if let Some(state_value) = trimmed.split(':').nth(1) {
                if state_value.trim().eq_ignore_ascii_case("connected") {
                    state_connected = true;
                }
            }
        }

        if trimmed.starts_with("SSID") && trimmed.contains(ssid) {
            ssid_matched = true;
        }
    }

    if state_connected && ssid_matched {
        Ok(ConnectResult {
            success: true,
            error: None,
        })
    } else {
        Ok(ConnectResult {
            success: false,
            error: Some(
                "Connected command accepted, but system is not connected (possibly wrong password)"
                    .to_string(),
            ),
        })
    }
}

fn generate_profile_xml(ssid: &str, password: &str) -> String {
    format!(
        r#"<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
  <name>{ssid}</name>
  <SSIDConfig>
    <SSID>
      <name>{ssid}</name>
    </SSID>
  </SSIDConfig>
  <connectionType>ESS</connectionType>
  <connectionMode>manual</connectionMode>
  <MSM>
    <security>
      <authEncryption>
        <authentication>WPA2PSK</authentication>
        <encryption>AES</encryption>
        <useOneX>false</useOneX>
      </authEncryption>
      <sharedKey>
        <keyType>passPhrase</keyType>
        <protected>false</protected>
        <keyMaterial>{password}</keyMaterial>
      </sharedKey>
    </security>
  </MSM>
</WLANProfile>"#
    )
}

fn generate_open_profile_xml(ssid: &str) -> String {
    format!(
        r#"<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
  <name>{ssid}</name>
  <SSIDConfig>
    <SSID>
      <name>{ssid}</name>
    </SSID>
  </SSIDConfig>
  <connectionType>ESS</connectionType>
  <connectionMode>manual</connectionMode>
  <MSM>
    <security>
      <authEncryption>
        <authentication>open</authentication>
        <encryption>none</encryption>
        <useOneX>false</useOneX>
      </authEncryption>
    </security>
  </MSM>
</WLANProfile>"#
    )
}

struct ConnectResult {
    success: bool,
    error: Option<String>,
}

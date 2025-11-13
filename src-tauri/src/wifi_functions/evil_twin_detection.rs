use crate::structures::WifiNetwork;
use std::cmp::Reverse;
use std::collections::HashMap;

fn encryption_strength(auth: &str, enc: &str) -> u8 {
    match (auth.to_lowercase().as_str(), enc.to_lowercase().as_str()) {
        ("wpa3-personal", _) => 4,
        ("wpa2-personal", "aes") | ("wpa2-personal", "ccmp") => 3,
        ("wpa2-personal", "tkip") => 2,
        ("wep", _) => 1,
        ("open", _) => 0,
        _ => 0,
    }
}

pub fn mark_evil_twins(networks: &mut Vec<WifiNetwork>) {
    let mut ssid_map: HashMap<String, Vec<&mut WifiNetwork>> = HashMap::new();

    for net in networks.iter_mut() {
        if net.ssid.trim().is_empty() {
            continue;
        }

        ssid_map.entry(net.ssid.clone()).or_default().push(net);
    }

    for (_ssid, group) in ssid_map.iter_mut() {
        if group.len() < 2 {
            continue;
        }

        group.sort_by_key(|n| Reverse(encryption_strength(&n.authentication, &n.encryption)));
        let strongest_strength =
            encryption_strength(&group[0].authentication, &group[0].encryption);

        let avg_signal: i32 = group
            .iter()
            .map(|n| {
                let mut signal = 0;
                if let Ok(signal_strength) = n.signal.trim_end_matches('%').parse::<i32>() {
                    signal = signal_strength
                }
                signal
            })
            .sum::<i32>()
            / group.len() as i32;

        for net in group.iter_mut() {
            let this_strength = encryption_strength(&net.authentication, &net.encryption);

            let mut suspicion_score = 0;
            if this_strength < strongest_strength {
                suspicion_score += 2;
            }

            if let Ok(signal_strength) = net.signal.trim_end_matches('%').parse::<i32>() {
                if signal_strength > avg_signal + 20 {
                    suspicion_score += 2;
                }
            }

            if let Ok(signal_strength) = net.signal.trim_end_matches('%').parse::<i32>() {
                if signal_strength + 20 < avg_signal {
                    suspicion_score += 1;
                }
            }

            if suspicion_score >= 3 {
                net.is_evil_twin = true;
                net.risk = "C".to_string();
            } else if suspicion_score == 2 {
                net.is_evil_twin = true;
                net.risk = "H".to_string();
            }
        }
    }
}

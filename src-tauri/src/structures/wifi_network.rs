use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct WifiNetwork {
    pub(crate) ssid: String,
    pub(crate) authentication: String,
    pub(crate) encryption: String,
    pub(crate) bssid: String,
    pub(crate) signal: String,
    pub(crate) risk: String,
    pub(crate) is_evil_twin: bool,
}

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct OnTransferMessage {
    pub public_key: String,
    pub message: String,
}

impl OnTransferMessage {
    pub fn from_string(json: String) -> Result<OnTransferMessage, serde_json::Error> {
        serde_json::from_str(json.as_str())
    }
}
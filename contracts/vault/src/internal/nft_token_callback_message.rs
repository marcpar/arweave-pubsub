use near_sdk::AccountId;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct NFTTokenCallbackMessage {
    pub public_key: Vec<u8>,
    pub nft_account_id: AccountId,
    pub message: String,
}
 
use near_sdk::{
    AccountId, serde::{self,Serialize, Deserialize}
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "self::serde")]
pub struct NFTTokenCallbackMessage {
    pub public_key: String,
    pub nft_account_id: AccountId,
    pub message: String,
}
 
use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    serde::{self, Deserialize, Serialize},
    AccountId, PublicKey,
};

/// A claimable nft
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "self::serde")]
pub struct Claimable {
    /// id of the nft
    pub token_id: TokenId,
    /// account id where the nft contract is deployed
    pub nft_account_id: AccountId,
    /// public key that is used to verify the authenticity of the claim
    ///
    /// near public key
    /// should be parsable into near_sdk::PublicKey
    pub public_key: String,
}

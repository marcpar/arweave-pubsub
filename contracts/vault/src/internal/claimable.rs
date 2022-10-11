use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    AccountId,
};
use serde::{Deserialize, Serialize};

/// A claimable nft
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct Claimable {
    /// id of the nft
    pub token_id: TokenId,
    /// account id where the nft contract is deployed
    pub nft_account_id: AccountId,
    /// public key that is used to verify the authenticity of the claim
    ///
    /// ed25519 public key
    pub public_key: Vec<u8>,
}

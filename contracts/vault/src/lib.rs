use near_contract_standards::{
    non_fungible_token::approval::NonFungibleTokenApprovalReceiver, non_fungible_token::TokenId,
};

use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupMap,
    near_bindgen, AccountId, BorshStorageKey, PanicOnDefault,
};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
enum StorageKey {
    ClaimablesKey,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
struct Contract {
    claimables: LookupMap<String, LockedNFT>,
}

struct LockedNFT {
    pub token_id: TokenId,
    pub nft_contract_account_id: AccountId,
    pub public_key: String,
    pub approval_id: u64,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn default() -> Self {
        Self {
            claimables: LookupMap::new(StorageKey::ClaimablesKey),
        }
    }
}

impl NonFungibleTokenApprovalReceiver for Contract {
    fn nft_on_approve(
        &mut self,
        token_id: TokenId,
        owner_id: AccountId,
        approval_id: u64,
        msg: String,
    ) -> near_sdk::PromiseOrValue<String> {
        todo!()
    }
}

use std::str::FromStr;

use external::nft::external_nft;
use near_contract_standards::{
    non_fungible_token::TokenId,
    non_fungible_token::{core::NonFungibleTokenReceiver, Token},
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupMap,
    env, log, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, PromiseError,
    PromiseOrValue, PublicKey,
};
use serde::{Deserialize, Serialize};

mod external;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
enum StorageKey {
    ClaimablesKey,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
struct Contract {
    pub claimables: LookupMap<String, Claimable>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
struct Claimable {
    pub token_id: TokenId,
    pub nft_account_id: AccountId,
    pub public_key: PublicKey,
}

#[derive(Serialize, Deserialize)]
pub struct OnTransferMessage {
    pub public_key: String,
    pub message: String,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn default() -> Self {
        Self {
            claimables: LookupMap::new(StorageKey::ClaimablesKey),
        }
    }

    #[private]
    pub fn nft_token_callback(
        &mut self,
        #[callback_result] call_result: Result<Token, PromiseError>,
        on_transfer_message: OnTransferMessage,
        nft_account: AccountId,
    ) -> bool {
        if call_result.is_err() {
            return true;
        }
        let token = call_result.unwrap();
        log!("{}", serde_json::to_string(&token).unwrap());

        if token.owner_id.as_str() == env::current_account_id().as_str() {
            self.claimables.insert(
                &format!("{}:{}", nft_account.as_str(), token.token_id.as_str()),
                &Claimable {
                    token_id: token.token_id,
                    nft_account_id: nft_account,
                    public_key: PublicKey::from_str(&on_transfer_message.public_key.as_str())
                        .unwrap(),
                },
            );
        }
        false
    }

    pub fn get_claimable(&self, nft_account: String, token_id: String) -> Option<Claimable> {
        self.claimables
            .get(&format!("{}:{}", nft_account.as_str(), token_id.as_str()))
    }
}

const WHITE_LISTED_NFT: [&'static str; 1] = ["nft.nftdw-001.testnet"];

#[near_bindgen]
impl NonFungibleTokenReceiver for Contract {
    #[payable]
    fn nft_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_id: AccountId,
        token_id: TokenId,
        msg: String,
    ) -> PromiseOrValue<bool> {
        let payload: OnTransferMessage = serde_json::from_str(&msg).unwrap();
        log!(
            "message: {}, public_key: {}",
            payload.message,
            payload.public_key
        );

        let nft = env::predecessor_account_id();
        if !WHITE_LISTED_NFT.contains(&nft.as_str()) {
            panic!(
                "{} is not allowed to lock tokens on this vault",
                &nft.as_str()
            )
        }

        PromiseOrValue::Promise(
            external_nft::ext(nft.clone())
                .nft_token(token_id)
                .then(
                    Self::ext(env::current_account_id())
                        .nft_token_callback(payload, nft),
                ),
        )
    }
}

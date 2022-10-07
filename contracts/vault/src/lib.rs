use ed25519_dalek::{PublicKey, Signature, Verifier};
use external::nft::external_nft;
use internal::claim_challenge::ClaimChallenge;
use near_contract_standards::{
    non_fungible_token::TokenId,
    non_fungible_token::{core::NonFungibleTokenReceiver, Token},
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupMap,
    env, log, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, PromiseError,
    PromiseOrValue, ONE_YOCTO,
};
use serde::{Deserialize, Serialize};

mod external;
mod internal;

const WHITE_LISTED_NFT: [&'static str; 2] =
    ["nft.nftdw-001.testnet", "nft.world-triathlon.testnet"];

const MILLIS_PER_MINUTE: u64 = 60_000;

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
pub struct Claimable {
    pub token_id: TokenId,
    pub nft_account_id: AccountId,
    pub public_key: Vec<u8>,
}

#[near_bindgen]
#[derive(Serialize, Deserialize)]
pub struct OnTransferMessage {
    pub public_key: String,
    pub message: String,
}

#[near_bindgen]
#[derive(Serialize, Deserialize)]
pub struct NFTTokenCallbackMessage {
    pub public_key: Vec<u8>,
    pub nft_account_id: AccountId,
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

    pub fn get_claimable(&self, nft_account: String, token_id: String) -> Option<Claimable> {
        self.claimables
            .get(&format!("{}:{}", nft_account.as_str(), token_id.as_str()))
    }

    /// View function to validate if generated claim_token is valid
    ///
    /// can be used from client side to validate if the user has the correct access key
    pub fn is_claimable(&self, claim_token: String) -> Option<Claimable> {
        let claim_challenge_parse_result = ClaimChallenge::from_claim_challenge_string(claim_token);
        if claim_challenge_parse_result.is_err() {
            log!(
                "failed to parse claim_token:\n{:?}",
                claim_challenge_parse_result.err()
            );
            return None;
        }
        let claim_challenge = claim_challenge_parse_result.unwrap();
        match self.validate_claim_challenge(&claim_challenge) {
            Ok(claimable) => Some(claimable),
            Err(error) => {
                env::log_str(error.as_str());
                None
            }
        }
    }

    #[payable]
    pub fn claim(&mut self, claim_token: String) -> PromiseOrValue<bool> {
        let claim_challenge_parse_result = ClaimChallenge::from_claim_challenge_string(claim_token);
        if claim_challenge_parse_result.is_err() {
            env::panic_str(format!(
                "failed to parse claim_token:\n{:?}",
                claim_challenge_parse_result.err()
            ).as_str());
        }
        let claim_challenge = claim_challenge_parse_result.unwrap();

        match self.validate_claim_challenge(&claim_challenge) {
            Ok(claimable) => PromiseOrValue::Promise(
                external_nft::ext(claimable.nft_account_id.clone())
                    .with_attached_deposit(ONE_YOCTO)
                    .nft_transfer(
                        claim_challenge.get_owner_id(),
                        claimable.token_id.clone(),
                        None,
                        None,
                    )
                    .then(Self::ext(env::current_account_id()).claim_callback(claimable)),
            ),
            Err(error) => env::panic_str(error.as_str()),
        }
    }

    #[private]
    pub fn claim_callback(
        &mut self,
        #[callback_result] call_result: Result<(), PromiseError>,
        claimable: Claimable,
    ) {
        if call_result.is_err() {
            return;
        }

        self.claimables.remove(&format!(
            "{}:{}",
            &claimable.nft_account_id, &claimable.token_id
        ));
    }

    #[private]
    pub fn nft_token_callback(
        &mut self,
        #[callback_result] call_result: Result<Token, PromiseError>,
        msg: NFTTokenCallbackMessage,
    ) -> bool {
        if call_result.is_err() {
            return true;
        }
        let token = call_result.unwrap();
        log!("{}", serde_json::to_string(&token).unwrap());

        let claimable = Claimable {
            token_id: token.token_id.clone(),
            nft_account_id: msg.nft_account_id.clone(),
            public_key: msg.public_key,
        };

        if token.owner_id.as_str() == env::current_account_id().as_str() {
            self.claimables.insert(
                &format!(
                    "{}:{}",
                    msg.nft_account_id.as_str(),
                    token.token_id.as_str()
                ),
                &claimable,
            );
        }
        false
    }

    fn validate_claim_challenge(
        &self,
        claim_challenge: &ClaimChallenge,
    ) -> Result<Claimable, String> {
        let current_timestamp_millis = env::block_timestamp_ms();
        if claim_challenge.get_timestamp_millis() > current_timestamp_millis {
            if claim_challenge.get_timestamp_millis() - current_timestamp_millis
                > 5 * MILLIS_PER_MINUTE
            {
                return Err("claim_challenge is too early".to_string());
            }
        } else {
            if current_timestamp_millis - claim_challenge.get_timestamp_millis()
                > 5 * MILLIS_PER_MINUTE
            {
                return Err("claim challenge is time is expired".to_string());
            }
        }

        let claimable = self.claimables.get(&format!(
            "{}:{}",
            claim_challenge.get_nft_account_id(),
            &claim_challenge.get_token_id()
        ));

        if claimable.is_none() {
            return Err(format!(
                "claimable {}:{} does not exists",
                claim_challenge.get_nft_account_id(),
                claim_challenge.get_token_id()
            ));
        }

        let claimable = claimable.unwrap();

        match PublicKey::from_bytes(claimable.public_key.as_slice())
            .unwrap()
            .verify(
                claim_challenge
                    .get_claim_challenge_details_bytes()
                    .as_slice(),
                &Signature::from_bytes(claim_challenge.get_signature().as_slice()).unwrap(),
            ) {
            Ok(()) => Ok(claimable),
            Err(e) => Err(format!("dsa verification failed with err: {}", e)),
        }
    }
}

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
            external_nft::ext(nft.clone()).nft_token(token_id).then(
                Self::ext(env::current_account_id()).nft_token_callback(NFTTokenCallbackMessage {
                    public_key: PublicKey::from_bytes(
                        bs58::decode(payload.public_key.split(":").collect::<Vec<&str>>()[1])
                            .into_vec()
                            .unwrap()
                            .as_slice(),
                    )
                    .unwrap()
                    .as_bytes()
                    .to_vec(),
                    nft_account_id: nft,
                    message: payload.message,
                }),
            ),
        )
    }
}

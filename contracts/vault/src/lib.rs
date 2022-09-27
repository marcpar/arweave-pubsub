use base64;
use ed25519_dalek::{PublicKey, Signature, Verifier};
use external::nft::external_nft::{self, ExternalNFTExt};
use near_contract_standards::{
    non_fungible_token::TokenId,
    non_fungible_token::{core::NonFungibleTokenReceiver, Token},
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LookupMap,
    env, log, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, PromiseError,
    PromiseOrValue, Timestamp, ONE_YOCTO,
};
use serde::{Deserialize, Serialize};

mod external;

const WHITE_LISTED_NFT: [&'static str; 2] = ["nft.nftdw-001.testnet", "nft.world-triathlon.testnet"];
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
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
struct ClaimChallenge {
    pub token_id: TokenId,
    pub nft_account_id: AccountId,
    pub timestamp_millis: Timestamp,
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

    pub fn get_timestamp_ms(&self) -> u64 {
        env::block_timestamp_ms()
    }

    /**
     *
     * @var claim_token
     *  <base64_claim_challenge>.<base64_signature>
     */
    pub fn is_claimable(&self, claim_token: String) -> Option<Claimable> {
        let claim_token_vec: Vec<&str> = claim_token.split(".").collect();
        if claim_token_vec.len() != 2 {
            log!("invalid claim token format, should be on the form <base64_claim_challenge>.<base64_signature>, received {}", claim_token);
            return None;
        }

        let claim_challenge_bytes = base64::decode(claim_token_vec[0]).unwrap();
        let claim_challenge_signature_bytes = base64::decode(claim_token_vec[1]).unwrap();

        let claim_challenge: ClaimChallenge = serde_json::from_str(
            String::from_utf8(claim_challenge_bytes.clone())
                .unwrap()
                .as_str(),
        )
        .unwrap();

        log!(
            "claim challenge json: {}",
            serde_json::to_string(&claim_challenge).unwrap().as_str()
        );

        let current_timestamp_millis = env::block_timestamp_ms();
        if claim_challenge.timestamp_millis > current_timestamp_millis {
            if claim_challenge.timestamp_millis - current_timestamp_millis > 5 * MILLIS_PER_MINUTE {
                log!("claim_challenge is too early");
                return None;
            }
        } else {
            if current_timestamp_millis - claim_challenge.timestamp_millis > 5 * MILLIS_PER_MINUTE {
                log!("claim challenge is time is expired");
                return None;
            }
        }

        let claimable = self.claimables.get(&format!(
            "{}:{}",
            claim_challenge.nft_account_id, &claim_challenge.token_id
        ));

        if claimable.is_none() {
            log!(
                "claimable {}:{} does not exists",
                claim_challenge.nft_account_id,
                claim_challenge.token_id
            );
            return None;
        }

        let claimable = claimable.unwrap();

        match PublicKey::from_bytes(claimable.public_key.as_slice())
            .unwrap()
            .verify(
                &claim_challenge_bytes.as_slice(),
                &Signature::from_bytes(claim_challenge_signature_bytes.as_slice()).unwrap(),
            ) {
            Ok(()) => Some(claimable),
            Err(e) => {
                log!("dsa verification failed with err: {}", e);
                None
            }
        }
    }

    #[payable]
    pub fn claim(&mut self, claim_token: String) -> PromiseOrValue<bool> {
        match self.is_claimable(claim_token) {
            Some(claimable) => PromiseOrValue::Promise(
                external_nft::ext(claimable.nft_account_id.clone())
                    .with_attached_deposit(ONE_YOCTO)
                    .nft_transfer(
                        env::signer_account_id(),
                        claimable.token_id.clone(),
                        None,
                        None,
                    )
                    .then(Self::ext(env::current_account_id()).claim_callback(claimable)),
            ),
            None => PromiseOrValue::Value(false),
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

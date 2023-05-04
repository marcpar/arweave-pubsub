use external::{account_creator::external_account_creator, nft::external_nft};
use internal::claimable::Claimable;
use near_contract_standards::{
    non_fungible_token::TokenId,
    non_fungible_token::{core::NonFungibleTokenReceiver, Token},
};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::{LookupMap, UnorderedSet},
    env, log, near_bindgen, require,
    utils::assert_one_yocto,
    AccountId, Balance, BorshStorageKey, Gas, PanicOnDefault, Promise, PromiseError,
    PromiseOrValue, PublicKey, ONE_YOCTO,
};

use crate::internal::{
    nft_token_callback_message::NFTTokenCallbackMessage, on_transfer_message::OnTransferMessage,
};

mod external;
mod internal;

const MILLIS_PER_MINUTE: u64 = 60_000;
const ONE_MILLINEAR: Balance = 1_000_000_000_000_000_000_000;

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
enum StorageKey {
    ClaimablesKey,
    AllowedNFTsKey,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
struct Contract {
    pub claimables: LookupMap<String, Claimable>,
    pub allowed_nfts: UnorderedSet<AccountId>,
}

#[near_bindgen]
impl Contract {
    /// initial with default fields
    #[init]
    pub fn default() -> Self {
        Self {
            claimables: LookupMap::new(StorageKey::ClaimablesKey),
            allowed_nfts: UnorderedSet::new(StorageKey::AllowedNFTsKey),
        }
    }

    /// get allowed nft accounts to lock tokens on this vault
    pub fn get_allowed_nfts(&self) -> Vec<AccountId> {
        self.allowed_nfts.to_vec()
    }

    /// allow an nft contract to lock tokens on this vault
    #[private]
    pub fn allow_nft(&mut self, account_id: AccountId) -> bool {
        self.allowed_nfts.insert(&account_id)
    }

    /// remove an nft contract on the allowed list
    #[private]
    pub fn remove_allowed_nft(&mut self, account_id: AccountId) -> bool {
        self.allowed_nfts.remove(&account_id)
    }

    /// get a claimable
    pub fn get_claimable(&self, nft_account: String, token_id: String) -> Option<Claimable> {
        self.claimables
            .get(&format!("{}:{}", nft_account.as_str(), token_id.as_str()))
    }

    /// drop a claimable to specific user
    ///
    /// this method is called using an access key
    #[private]
    pub fn claim(
        &mut self,
        receiver_id: AccountId,
        claimable_id: String,
        new_public_key: Option<PublicKey>,
    ) -> Promise {
        let claimable = self.claimables.get(&claimable_id);
        if claimable.is_none() {
            env::panic_str(format!("claimable does not exist: {}", claimable_id).as_str());
        }
        let claimable = claimable.unwrap();

        if claimable.public_key.parse::<PublicKey>().unwrap() != env::signer_account_pk() {
            env::panic_str("claimable public key does not match signer_account_pk");
        }

        let top_level_account: AccountId =
            match env::current_account_id().as_str().ends_with(".near") {
                true => "near".parse().unwrap(),
                false => "testnet".parse().unwrap(),
            };

        match new_public_key {
            Some(public_key) => external_account_creator::ext(top_level_account)
                .with_attached_deposit(10 * ONE_MILLINEAR)
                .with_static_gas(Gas(10_000_000_000_000))
                .create_account(receiver_id.clone(), public_key)
                .then(
                    Self::ext(env::current_account_id())
                        .create_account_callback(receiver_id, claimable),
                ),
            None => external_nft::ext(claimable.nft_account_id.clone())
                .with_attached_deposit(ONE_YOCTO)
                .nft_transfer(receiver_id, claimable.token_id.clone(), None, None)
                .then(Self::ext(env::current_account_id()).claim_callback(claimable)),
        }
    }

    #[private]
    /// create account callback
    pub fn create_account_callback(
        &mut self,
        #[callback_result] call_result: Result<bool, PromiseError>,
        receiver_id: AccountId,
        claimable: Claimable,
    ) -> Promise {
        if let Err(error) = call_result {
            env::panic_str(format!("Failed to create account: {:?}", error).as_str())
        }
        if !call_result.unwrap() {
            env::panic_str("Failed to create account: false")
        }

        external_nft::ext(claimable.nft_account_id.clone())
            .with_attached_deposit(ONE_YOCTO)
            .nft_transfer(receiver_id, claimable.token_id.clone(), None, None)
            .then(Self::ext(env::current_account_id()).claim_callback(claimable))
    }

    /// claim callback
    #[private]
    pub fn claim_callback(
        &mut self,
        #[callback_result] call_result: Result<(), PromiseError>,
        claimable: Claimable,
    ) -> PromiseOrValue<()> {
        if call_result.is_err() {
            return PromiseOrValue::Value(());
        }

        self.claimables.remove(&format!(
            "{}:{}",
            &claimable.nft_account_id, &claimable.token_id
        ));

        if env::current_account_id() == env::signer_account_id() {
            return PromiseOrValue::Promise(
                Promise::new(env::current_account_id()).delete_key(env::signer_account_pk()),
            );
        }

        PromiseOrValue::Value(())
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

        let claimable = Claimable {
            token_id: token.token_id.clone(),
            nft_account_id: msg.nft_account_id.clone(),
            public_key: msg.public_key.clone(),
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

        Promise::new(env::current_account_id()).add_access_key(
            msg.public_key.parse().unwrap(),
            100 * ONE_MILLINEAR,
            env::current_account_id(),
            "claim".to_string(),
        );
        false
    }

    pub fn renew_claimable(
        &mut self,
        nft_account_id: AccountId,
        token_id: TokenId,
        public_key: String,
    ) -> Promise {
        if !(env::signer_account_id() == nft_account_id
            && self.allowed_nfts.contains(&nft_account_id))
            && (env::signer_account_id() != env::current_account_id())
        {
            env::panic_str(
                format!(
                    "{} is not authorized to renew claimable",
                    env::signer_account_id()
                )
                .as_str(),
            )
        }

        let claimable_key = format!("{}:{}", nft_account_id, token_id);
        let claimable = match self.claimables.get(&claimable_key) {
            Some(claimable) => claimable,
            None => {
                env::panic_str(format!("claimable {} does not exists", &claimable_key).as_str())
            }
        };

        self.claimables
            .insert(
                &claimable_key,
                &Claimable {
                    token_id,
                    nft_account_id,
                    public_key: public_key.clone(),
                },
            )
            .expect(format!("claimable {} exists", &claimable_key).as_str());

        Promise::new(env::current_account_id())
            .delete_key(claimable.public_key.parse().unwrap())
            .then(Promise::new(env::current_account_id()).add_access_key(
                public_key.parse().unwrap(),
                100 * ONE_MILLINEAR,
                env::current_account_id(),
                "claim".to_string(),
            ))
    }
}

#[near_bindgen]
impl NonFungibleTokenReceiver for Contract {
    fn nft_on_transfer(
        &mut self,
        sender_id: AccountId,
        previous_owner_id: AccountId,
        token_id: TokenId,
        msg: String,
    ) -> PromiseOrValue<bool> {
        let nft = env::predecessor_account_id();

        require!(
            self.allowed_nfts.contains(&nft),
            format!(
                "{} is not allowed to lock tokens on this vault",
                &nft.as_str()
            )
        );

        let payload: OnTransferMessage = OnTransferMessage::from_string(msg.to_string()).unwrap();
        log!(
            "message: {}, public_key: {}",
            payload.message,
            payload.public_key
        );

        if let Some(err) = payload.public_key.parse::<PublicKey>().err() {
            panic!(
                "public_key should be a valid near parsable PublicKey: {:?}",
                err
            )
        }

        PromiseOrValue::Promise(external_nft::ext(nft.clone()).nft_token(token_id).then(
            Self::ext(env::current_account_id()).nft_token_callback(NFTTokenCallbackMessage {
                public_key: payload.public_key,
                nft_account_id: nft,
                message: payload.message,
            }),
        ))
    }
}

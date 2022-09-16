use std::str::FromStr;

use near_contract_standards::{
    impl_non_fungible_token_approval, impl_non_fungible_token_core,
    impl_non_fungible_token_enumeration,
    non_fungible_token::{metadata::NFT_METADATA_SPEC, Token, TokenId},
    non_fungible_token::{
        metadata::{NFTContractMetadata, NonFungibleTokenMetadataProvider, TokenMetadata},
        NonFungibleToken,
    },
};

use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LazyOption,
    env,
    json_types::Base64VecU8,
    near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, Promise, PromiseOrValue, require,
};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
enum StorageKey {
    OwnerByID,
    TokenMetadata,
    Enumeration,
    Approval,
    ContractMetadata,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
struct Contract {
    nft: NonFungibleToken,
    metadata: LazyOption<NFTContractMetadata>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn default() -> Self {
        let metadata = NFTContractMetadata {
            spec: NFT_METADATA_SPEC.to_string(),
            name: "NFT Design Works".to_string(),
            symbol: "NFTDW".to_string(),
            icon: None,
            base_uri: Some("https://arweave.net".to_string()),
            reference: None,
            reference_hash: None,
        };
        Self {
            nft: NonFungibleToken::new(
                StorageKey::OwnerByID,
                env::current_account_id(),
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::ContractMetadata, Some(&metadata)),
        }
    }

    #[private]
    #[payable]
    pub fn mint(
        &mut self,
        token_id: String,
        owner_address: Option<String>,
        media_id: String,
        metadata_id: String,
        title: Option<String>,
        description: Option<String>,
        media_hash: Option<Base64VecU8>,
        copies: Option<u64>,
        issued_at: Option<String>,
        expires_at: Option<String>,
        starts_at: Option<String>,
        updated_at: Option<String>,
        extra: Option<String>,
        reference_hash: Option<Base64VecU8>,
    ) -> Token {
        self.nft.internal_mint(
            TokenId::from_str(token_id.as_str()).unwrap(),
            match owner_address {
                Some(address) => address.parse().unwrap(),
                None => env::signer_account_id(),
            },
            Some(TokenMetadata {
                title,
                description,
                media: Some(media_id),
                media_hash,
                copies,
                issued_at,
                expires_at,
                starts_at,
                updated_at,
                extra,
                reference: Some(metadata_id),
                reference_hash,
            }),
        )
    }

    pub fn burn(&mut self, token_id: TokenId) -> bool {
        let owner_id = self.nft.owner_by_id.get(&token_id.to_string()).unwrap();

        require!(
            owner_id == env::predecessor_account_id(),
            "token can only be burned by the owner"
        );

        let mut burned = false;

        if self
            .nft
            .token_metadata_by_id
            .as_mut()
            .unwrap()
            .remove(&token_id.to_string())
            .is_some()
        {
            burned = true;
        }

        if self.nft.owner_by_id.remove(&token_id.to_string()).is_some() {
            burned = true;
        }

        return burned;
    }

}

impl_non_fungible_token_core!(Contract, nft);
impl_non_fungible_token_approval!(Contract, nft);
impl_non_fungible_token_enumeration!(Contract, nft);

#[near_bindgen]
impl NonFungibleTokenMetadataProvider for Contract {
    fn nft_metadata(&self) -> NFTContractMetadata {
        self.metadata.get().unwrap()
    }
}

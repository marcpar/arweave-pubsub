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
    env, near_bindgen, AccountId, BorshStorageKey, PanicOnDefault, Promise, PromiseOrValue,
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
    pub fn mint(&mut self, id: String, media_id: String, metadata_id: String, owner_id: String, title: String, metadata: Option<String>) {
        self.nft.internal_mint(
            TokenId::from_str(id.as_str()).unwrap(),
            AccountId::from_str(owner_id.as_str()).unwrap(),
            Some(TokenMetadata {
                title: Some(title),
                description: None,
                media: Some(media_id),
                media_hash: None,
                copies: None,
                issued_at: None,
                expires_at: None,
                starts_at: None,
                updated_at: None,
                extra: metadata,
                reference: Some(metadata_id),
                reference_hash: None,
            }),
        );
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

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
            name: "World Triathlon".to_string(),
            symbol: "WT".to_string(),
            icon: Some("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5QsIFRgqe3QJewAAAhZJREFUWMPt1b2LVVcUxuFnnXtmyEwUi4i9iKaKRot0CVhZRUTBQgULYQaFaCEIkWAIQv4ACxFLxYhFCsV0KRwbSREFCxGxSCAEhBj8ALnqnb1S3DPjHTk3MxqjhfcHm7PZ6z1rv3ut88GIESPed2Iqy3chaUZ/XgxfKwKhyHlNPxZLzvEiT41j77IC9cC8i4eYxPIW7RM8bmKTA/c8eI19lxHLyAUGruAQuQ9HFuoTLuB7fIs9TWAGB9FDDNms01xnm2uP/AqHX67A4zHdOz3jNxozK7B+IMHfyd3on/gJruM3rJlz2MJT4pdQKnyG8cbIR20t8NSH0fH8AbGffITz+KLlRLdCfJnKFvw4YHKQCn9ic7PxWaxCITqUedE8Y7qJDeShorpHHsdfLckL0W1KPz5k1BhrWhPNvG5inUGXbewNueOkyZ9DnhqiieaEl3CxGZdx3ytQD1mfCPnNAd1fgxNNGReYTdkpetcq9c7GT5KT+Amf/1cD8An5dYr90W/FxsHHPCiVehOm++ZyLt/aN1GBOXbhaig/pLgdenK+EFGwGvu0P4RLolokPoGjqbOO6vdcVP5mDLz8Tn+Mo/3+xhJSvho1zulnvjdrbE8om1p028k/iJvkOqxMZRfxKflvribIbSnqkB+0CWIqS4TZxG6cCVm91b/h6ahyOp/T/0Q+83/UeZEWzDGDrW/bwIgRI945/wC1LcF+TG5FFAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMS0xMS0wOFQyMToyNDo0MiswMDowMKSIPSMAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjEtMTEtMDhUMjE6MjQ6NDIrMDA6MDDV1YWfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAFd6VFh0UmF3IHByb2ZpbGUgdHlwZSBpcHRjAAB4nOPyDAhxVigoyk/LzEnlUgADIwsuYwsTIxNLkxQDEyBEgDTDZAMjs1Qgy9jUyMTMxBzEB8uASKBKLgDqFxF08kI1lQAAAABJRU5ErkJggg==".to_string()),
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

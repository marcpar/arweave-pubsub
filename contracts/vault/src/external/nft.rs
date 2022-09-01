use near_contract_standards::non_fungible_token::{Token, TokenId};
use near_sdk::ext_contract;

#[ext_contract(external_nft)]
trait ExternalNFT {
    fn nft_token(&self, token_id: TokenId) -> Option<Token>;
}

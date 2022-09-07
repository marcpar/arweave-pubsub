use near_contract_standards::non_fungible_token::{Token, TokenId};
use near_sdk::{ext_contract, AccountId};

#[ext_contract(external_nft)]
trait ExternalNFT {
    fn nft_token(&self, token_id: TokenId) -> Option<Token>;
    fn nft_transfer(
        &mut self,
        receiver_id: AccountId,
        token_id: TokenId,
        approval_id: Option<u64>,
        memo: Option<String>,
    );
}

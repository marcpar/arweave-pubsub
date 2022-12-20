use near_sdk::{ext_contract, AccountId, PublicKey};

#[ext_contract(external_account_creator)]
trait AccountCreator {
    fn create_account(&mut self, new_account_id: AccountId, new_public_key: PublicKey) -> bool;
}

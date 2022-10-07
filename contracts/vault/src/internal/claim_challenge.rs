use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    AccountId, Timestamp,
};
use serde::{self, Deserialize, Serialize};

/// additional ClaimChallengeDetails
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct ClaimChallengeDetails {
    /// id of the token
    token_id: TokenId,

    /// account id where the token is deployed
    nft_account_id: AccountId,

    /// timestamp when the challenge is generated
    timestamp_millis: Timestamp,

    /// account id of the owner where ownership of the token shall be transfered
    owner_id: AccountId,
}

/// A challenge to claim a specific token
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
pub struct ClaimChallenge {
    /// additional ClaimChallenge details
    claim_challenge_details: ClaimChallengeDetails,

    /// claim_challenge_details attached on the challenge decoded from base64
    claim_challenge_details_bytes: Vec<u8>,

    /// signature attached on the challenge decoded from base64
    signature_bytes: Vec<u8>,

    /// raw string representing the ClaimChallenge
    ///
    /// it should be in the format <base64_string_claim_challenge_details_json>.<base64 signature>
    claim_challenge_string: String,
}

impl ClaimChallenge {
    /// builds a ClaimChallenge based on given claim_challenge string
    pub fn from_claim_challenge_string(claim_challenge: String) -> Result<ClaimChallenge, String> {
        let claim_challenge_vec = claim_challenge.split('.').collect::<Vec<&str>>();
        if claim_challenge_vec.len() != 2 {
            return Err("claim challenge should be in the format <base64_string_claim_challenge_json>.<base64 signature>".to_string());
        }

        let claim_challenge_utf8_result = base64::decode(claim_challenge_vec[0]);
        if claim_challenge_utf8_result.is_err() {
            return Err(format!(
                "failed to decode claim_challenge invalid base64 string:\n{:?}",
                claim_challenge_utf8_result.err()
            ));
        }

        let claim_challenge_details_bytes = claim_challenge_utf8_result.unwrap();
        let claim_challenge_utf8_json = String::from_utf8(claim_challenge_details_bytes.clone()).unwrap();
        let claim_challenge_details_result: Result<ClaimChallengeDetails, serde_json::Error> =
            serde_json::from_str(claim_challenge_utf8_json.as_str());
        if claim_challenge_details_result.is_err() {
            return Err(format!("failed to serialize claim_challenge"));
        }

        let claim_challenge_details = claim_challenge_details_result.unwrap();

        let signature_utf8_result = base64::decode(claim_challenge_vec[1]);
        if signature_utf8_result.is_err() {
            return Err(format!(""));
        }
        let signature_bytes = signature_utf8_result.unwrap();

        Ok(ClaimChallenge {
            claim_challenge_details,
            claim_challenge_details_bytes,
            signature_bytes,
            claim_challenge_string: claim_challenge,
        })
    }

    /// returns the token_id
    pub fn get_token_id(&self) -> TokenId {
        self.claim_challenge_details.token_id.clone()
    }

    /// returns nft_account_id
    pub fn get_nft_account_id(&self) -> AccountId {
        self.claim_challenge_details.nft_account_id.clone()
    }

    /// returns timestamp_millis
    pub fn get_timestamp_millis(&self) -> Timestamp {
        self.claim_challenge_details.timestamp_millis
    }

    /// retrns owner_id
    pub fn get_owner_id(&self) -> AccountId {
        self.claim_challenge_details.owner_id.clone()
    }

    pub fn get_claim_challenge_details_bytes(&self) -> Vec<u8> {
        self.claim_challenge_details_bytes.clone()
    }
    /// returns signature
    pub fn get_signature(&self) -> Vec<u8> {
        self.signature_bytes.clone()
    }

    /// returns claim_challenge_string
    pub fn get_raw_string(&self) -> String {
        self.claim_challenge_string.clone()
    }
}

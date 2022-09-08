import { Account } from "near-api-js";

type ClaimDetails = {
    VaultContract: string,
    NFTContract: string,
    PrivateKey: string,
    TokenId: string,
}

export default class VaultAccount extends Account {
    public async IsClaimable(claimDetails: ClaimDetails): Promise<boolean> {
        
        return false;
    }
}
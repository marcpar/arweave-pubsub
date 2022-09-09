import * as nearAPI from "near-api-js";

type ClaimDetails = {
    VaultContract: string,
    NFTContract: string,
    PrivateKey: string,
    TokenId: string,
}

type Claimable = {
    token_id: string,
    nft_account_id: string,
    public_key: Buffer,
}

interface VaultContract extends nearAPI.Contract {
    is_claimable: (args: {
        claim_token: string
    }) => Promise<boolean>,
    get_claimable: (args: {
        nft_account: string,
        token_id: string
    }) => Promise<Claimable | null>,
    claim: (args: {
        claim_token: string
    }, gas: string, deposit: string) => Promise<boolean> | Promise<void>
}

function GetVaultContract(account: nearAPI.Account): VaultContract {
    return new nearAPI.Contract(account, '', {
        viewMethods: ['is_claimable, get_claimable'],
        changeMethods: ['claim']
    }) as VaultContract;
}

export {
    GetVaultContract
}

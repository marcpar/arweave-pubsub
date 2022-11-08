import * as nearAPI from "near-api-js";
import { GetConfig, GetConnection } from "./connection";

type ClaimDetails = {
    VaultContract: string,
    NFTContract: string,
    PrivateKey: string,
    TokenId: string,
}

type Claimable = {
    token_id: string,
    nft_account_id: string,
    public_key: String,
}

type ClaimChallenge = {
    token_id: string,
    nft_account_id: string,
    timestamp_millis: number,
    owner_id: string,
}

const contractId = process.env.REACT_APP_VAULT_CONTRACT ?? "vault.world-triathlon.testnet";

const _networkId = process.env.REACT_APP_NEAR_NETWORK ?? "testnet";

interface VaultContract extends nearAPI.Contract {
    is_claimable: (args: {
        claim_token: string
    }) => Promise<Claimable | null>,
    get_claimable: (args: {
        nft_account: string,
        token_id: string
    }) => Promise<Claimable | null>,
    claim: (arg: {
        callbackUrl: string,
        args: {
            claim_token: string,
        }, gas: string, amount: string
    }) => Promise<boolean> | Promise<void>
}

function GetVaultContract(account: nearAPI.Account): VaultContract {
    return new nearAPI.Contract(account, contractId, {
        viewMethods: ['is_claimable, get_claimable'],
        changeMethods: ['claim']
    }) as VaultContract;
}

async function GetVaultContractAnonAsync(): Promise<VaultContract> {
    let near = await GetConnection(GetConfig(_networkId as any));
    let account = new nearAPI.Account(near.connection, contractId);
    return new nearAPI.Contract(account, contractId, {
        viewMethods: ['is_claimable', 'get_claimable'],
        changeMethods: []
    }) as VaultContract;
}

export {
    GetVaultContract,
    GetVaultContractAnonAsync
}

export type {
    ClaimDetails,
    Claimable,
    ClaimChallenge
}

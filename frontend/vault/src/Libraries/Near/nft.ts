import * as nearAPI from "near-api-js";
import { WalletConnection } from "near-api-js";
import { GetConfig, GetConfigInMemory, GetConnection } from "./connection";


let _network = process.env.REACT_APP_NEAR_NETWORK ?? "testnet";
type NFTToken = {
    token_id: string,
    owner_id: string,
    metadata: {
        title: string | null,
        description: string | null,
        media: string | null,
        media_hash: string | null,
        copies: number | null,
        issued_at: number | null,
        expires_at: number | null,
        starts_at: number | null,
        updated_at: number | null,
        extra: string | null,
        reference: string | null,
        reference_hash: string | null,
    }
}

interface NFTContract extends nearAPI.Contract {
    nft_token: (args: {
        token_id: string
    }) => Promise<NFTToken | null>;
}

async function GetNFTContract(nft: string): Promise<NFTContract> {
    let near = await GetConnection(GetConfigInMemory(_network as any));
    let account = new nearAPI.Account(near.connection, nft);

    return new nearAPI.Contract(account, nft, {
        viewMethods: ['nft_token'],
        changeMethods: []
    }) as NFTContract;
}

export {
    GetNFTContract
};

export type {
    NFTToken
};


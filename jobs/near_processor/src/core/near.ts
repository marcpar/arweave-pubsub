import {
    connect, ConnectConfig, Near, Contract, KeyPair
} from 'near-api-js';
import {
    parseNearAmount
} from 'near-api-js/lib/utils/format.js'

let _near: Near;
let _contract: MinterContract;

interface MinterContract extends Contract {
    mint(options: {
        callbackUrl?: string,
        meta?: string,
        args: {
            token_id: String,
            media_id: String,
            metadata_id: String,
            title?: String,
            description?: String,
            media_hash?: String,
            copies?: number,
            issued_at?: string,
            expires_at?: string,
            starts_at?: string,
            updated_at?: string,
            extra?: string,
            reference_hash?: Buffer
        },
        amount: string
    }): Promise<any>
    nft_metadata(): Promise<any>,
    nft_token(args: {
        token_id: string
    }): Promise<any>
}

type Token = {}

async function Init(config: ConnectConfig, accountID: string, accountKey: string, contractID: string = accountID) {

    await config.keyStore?.setKey(config.networkId, accountID, KeyPair.fromString(accountKey))

    _near = await connect(config);
    let account = await _near.account(accountID);
    _contract = new Contract(account, contractID, {
        changeMethods: ['mint'],
        viewMethods: ['nft_metadata', 'nft_token']
    }) as MinterContract;
}

async function GetToken(id: string): Promise<any> {
    return await _contract.nft_token({ token_id: id });
}

async function GetNFTMeta(): Promise<any> {
    return await _contract.nft_metadata();
}

async function Mint(): Promise<any> {
    return await _contract.mint({
        amount: parseNearAmount("0.01") as string,
        args: {
            token_id: "4",
            media_id: "ZkUxju5Y5Goy-OXw2O-mj8T_T4JSUHb7sDUhUMLNlgg",
            metadata_id: "ZkUxju5Y5Goy-OXw2O-mj8T_T4JSUHb7sDUhUMLNlgg/metadata.json",
        },
    });
}

export {
    Init,
    GetToken,
    GetNFTMeta,
    Mint
}

import {
    connect, ConnectConfig, Near, Contract, KeyPair, Account
} from 'near-api-js';
import {
    parseNearAmount
} from 'near-api-js/lib/utils/format.js'
import {
    randomUUID,
    createHash
} from 'crypto';
import { Payload } from '../queue/common.js';
import { FinalExecutionStatus } from 'near-api-js/lib/providers'
import axios from 'axios';
import { Logger } from '../lib/logger.js';
import { writeFileSync } from 'fs';


let _near: Near;
let _contract: MinterContract;
let _account: Account;
let _accountID: string;
let _accountKey: string;
let _contractID: string;
let _explorerBaseURL: string;
let _deposit: string;

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
            media_hash?: Buffer,
            copies?: number,
            issued_at?: string,
            expires_at?: string,
            starts_at?: string,
            updated_at?: string,
            extra?: string,
            reference_hash?: Buffer
        },
        amount: string
    }): Promise<Token>
    nft_metadata(): Promise<any>,
    nft_token(args: {
        token_id: string
    }): Promise<Token>
}

type Token = {
    token_id: string,
    owner_id: string,
    metadata: {
        title?: string,
        description?: string,
        media?: string,
        media_hash?: string,
        copies?: number,
        issued_at?: string,
        expires_at?: string,
        starts_at?: string,
        updated_at?: string,
        extra?: string,
        reference?: string,
        reference_hash?: string
    }
}

type MintResult = {
    Token: Token,
    ExplorerURL: string,
    TransactionId: string,
}

async function Init(config: ConnectConfig, deposit: string, accountID: string, accountKey: string, contractID: string = accountID) {
    _accountID = accountID;
    _accountKey = accountKey;
    _contractID = contractID;
    _explorerBaseURL = `https://explorer.${config.networkId}.near.org`;
    _deposit = deposit;

    await config.keyStore?.setKey(config.networkId, accountID, KeyPair.fromString(accountKey))

    _near = await connect(config);
    _account = await _near.account(accountID);

    _contract = new Contract(_account, contractID, {
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

async function Mint(payload: Payload): Promise<MintResult> {

    let media = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}`, {
        responseType: 'arraybuffer',
    })).data;
    let metadata = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}/metadata.json`, {
        responseType: 'arraybuffer',
    })).data;

    let media_hash = createHash('sha256').update(media).digest().toString('base64');
    let ref_hash = createHash('sha256').update(metadata).digest().toString('base64');
    
    let result = await _account.functionCall({
        contractId: _contractID,
        args: {
            token_id: randomUUID(),
            media_id: payload.ArweaveTxnId,
            media_hash: media_hash,
            metadata_id: `${payload.ArweaveTxnId}/metadata.json`,
            reference_hash: ref_hash,
            extra: Buffer.from(metadata).toString('utf-8'),
            copies: payload.Copies,
            description: payload.Description,
            expires_at: payload.ExpiresAt,
            issued_at: payload.IssuedAt,
            starts_at: payload.StartsAt,
            title: payload.Title,
            updated_at: payload.UpdatedAt
        },
        methodName: 'mint',
        attachedDeposit: parseNearAmount(_deposit)
    });

    Logger().debug(`Mint transaction result: ${JSON.stringify(result)}`);
    let status = result.status as FinalExecutionStatus;
    let token = {} as Token;
    if (status.SuccessValue) {
        token = JSON.parse(Buffer.from(status.SuccessValue, 'base64').toString('utf-8'));
    } else {
        throw new Error(`Failed called to mint: ${status.Failure}`)
    }

    return {
        Token: token,
        ExplorerURL: `${_explorerBaseURL}/transactions/${result.transaction_outcome.id}`,
        TransactionId: result.transaction_outcome.id
    }
}

export {
    Init,
    GetToken,
    GetNFTMeta,
    Mint
}

import {
    connect, ConnectConfig, Near, KeyPair, Account, DEFAULT_FUNCTION_CALL_GAS
} from 'near-api-js';
import {
    parseNearAmount,
} from 'near-api-js/lib/utils/format.js'
import {
    randomUUID,
    createHash
} from 'crypto';
import { Payload } from '../queue/common.js';
import { FinalExecutionStatus } from 'near-api-js/lib/providers'
import axios from 'axios';
import { Logger } from '../lib/logger.js';
import isValidUTF8 from 'utf-8-validate';
import { functionCall } from 'near-api-js/lib/transaction.js';
import { fileTypeFromBuffer } from 'file-type';

let _near: Near;
let _account: Account;
let _accountID: string;
let _accountKey: string;
let _contractID: string;
let _explorerBaseURL: string;
let _deposit: string;
let _minter: Minter;

class Minter extends Account {

    public async MintNFT(payload: Payload): Promise<MintResult> {

        let media = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}`, {
            responseType: 'arraybuffer',
        })).data;
        let media_ext = (await fileTypeFromBuffer(media))?.ext ?? "jpeg";
        let metadata = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}/metadata.json`, {
            responseType: 'arraybuffer',
        })).data;


        let media_hash = createHash('sha256').update(media).digest().toString('base64');
        let ref_hash: string | undefined;
        if (isValidUTF8(metadata)) {
            ref_hash = createHash('sha256').update(metadata).digest().toString('base64');
        }

        let token_id = randomUUID();
        let actions = [
            functionCall(
                'mint',
                {
                    token_id: token_id,
                    owner_address: payload.OwnerAddress ?? this.accountId,
                    media_id: `${payload.ArweaveTxnId}/nft.${media_ext}`,
                    media_hash: media_hash,
                    metadata_id: `${payload.ArweaveTxnId}/metadata.json`,
                    reference_hash: ref_hash,
                    extra: ref_hash ? Buffer.from(metadata).toString('utf-8') : null,
                    copies: payload.Copies,
                    description: payload.Description,
                    expires_at: payload.ExpiresAt,
                    issued_at: payload.IssuedAt,
                    starts_at: payload.StartsAt,
                    title: payload.Title,
                    updated_at: payload.UpdatedAt
                },
                DEFAULT_FUNCTION_CALL_GAS,
                parseNearAmount(_deposit)
            ),
        ];

        let result = await this.signAndSendTransaction({
            receiverId: this.accountId,
            actions: actions
        });
        Logger().debug(`Mint transaction result:\n${JSON.stringify(result)}`);

        let status = result.status as FinalExecutionStatus;
        let token = {} as Token;
        if (status.SuccessValue) {
            token = JSON.parse(Buffer.from(status.SuccessValue, 'base64').toString('utf-8'));
            Logger().debug(JSON.stringify(token));
        } else {
            throw new Error(`Failed called to mint: ${status.Failure}`)
        }

        let mintResult = {
            ExplorerURL: `${_explorerBaseURL}/transactions/${result.transaction_outcome.id}`,
            TransactionId: result.transaction_outcome.id,
            TokenId: token_id
        } as MintResult;
        
        return mintResult;
    }
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
    ExplorerURL: string,
    TransactionId: string,
    TokenId: string,
}

type ClaimDetails = {
    VaultContract: string,
    NFTContract: string,
    PrivateKey: string,
    TokenId: string,
}

type InitConfig = {
    deposit: string,
    accountID: string,
    accountKey: string, 
    contractID: string,
}

async function Init(connectConfig: ConnectConfig, initConfig: InitConfig) {
    _accountID = initConfig.accountID;
    _accountKey = initConfig.accountKey;
    _contractID = initConfig.contractID;
    _explorerBaseURL = `https://explorer.${connectConfig.networkId}.near.org`;
    _deposit = initConfig.deposit;

    await connectConfig.keyStore?.setKey(connectConfig.networkId, _accountID, KeyPair.fromString(_accountKey))

    _near = await connect(connectConfig);
    _account = await _near.account(_accountID);
    _minter = new Minter(_near.connection, _accountID);
}

async function Mint(payload: Payload): Promise<MintResult> {
    return await _minter.MintNFT(payload);
}

export {
    Init,
    Mint,
    ClaimDetails
}

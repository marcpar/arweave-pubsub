import {
    connect, ConnectConfig, Near, Contract, KeyPair, Account, DEFAULT_FUNCTION_CALL_GAS
} from 'near-api-js';
import {
    parseNearAmount,
    formatNearAmount,
    NEAR_NOMINATION,

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
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair.js';
import { writeFileSync } from 'fs';

let _near: Near;
let _account: Account;
let _accountID: string;
let _accountKey: string;
let _contractID: string;
let _explorerBaseURL: string;
let _deposit: string;
let _minter: Minter

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
        let vault_address = 'vault.nftdw-001.testnet';
        let claimDetails: ClaimDetails | undefined;
        if (payload.OwnerAddress === undefined || payload.OwnerAddress === null) {
            let keypair = KeyPairEd25519.fromRandom();
            writeFileSync(`dist/keys/${token_id}.json`, JSON.stringify({
                private_key: keypair.secretKey,
                public_key: keypair.publicKey.toString()
            }));

            claimDetails = {
                NFTContract: this.accountId,
                TokenId: token_id,
                PublicKey: keypair.publicKey.toString(),
                VaultContract: vault_address
            };

            actions.push(functionCall(
                'nft_transfer_call',
                {
                    receiver_id: vault_address,
                    token_id: token_id,
                    msg: JSON.stringify({
                        public_key: keypair.publicKey.toString(),
                        message: `lock nft ${this.accountId}:${token_id} on vault`
                    })
                },
                60000000000000,
                "1"
            ));
        }

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

        return {
            ExplorerURL: `${_explorerBaseURL}/transactions/${result.transaction_outcome.id}`,
            TransactionId: result.transaction_outcome.id,
            ClaimDetails: claimDetails
        };
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
    ClaimDetails?: ClaimDetails
}

type ClaimDetails = {
    VaultContract: string,
    NFTContract: string,
    PublicKey: string,
    TokenId: string,
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
    _minter = new Minter(_near.connection, _accountID);
}

async function Mint(payload: Payload): Promise<MintResult> {
    return await _minter.MintNFT(payload);
    /*
    let media = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}`, {
        responseType: 'arraybuffer',
    })).data;
    let metadata = (await axios.default.get<Buffer>(`https://arweave.net/${payload.ArweaveTxnId}/metadata.json`, {
        responseType: 'arraybuffer',
    })).data;


    let media_hash = createHash('sha256').update(media).digest().toString('base64');
    let ref_hash: string | undefined;
    if (isValidUTF8(metadata)) {
        ref_hash = createHash('sha256').update(metadata).digest().toString('base64');
    }


    let result = await _account.functionCall({
        contractId: _contractID,
        args: {
            token_id: randomUUID(),
            owner_address: payload.OwnerAddress,
            media_id: payload.ArweaveTxnId,
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
        ExplorerURL: `${_explorerBaseURL}/transactions/${result.transaction_outcome.id}`,
        TransactionId: result.transaction_outcome.id
    }*/
}

export {
    Init,
    Mint
}

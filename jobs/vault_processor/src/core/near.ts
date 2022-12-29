import {
    connect, ConnectConfig, Near, KeyPair, Account, DEFAULT_FUNCTION_CALL_GAS
} from 'near-api-js';
import { Payload } from '../queue/common.js';
import { FinalExecutionStatus } from 'near-api-js/lib/providers/index.js'
import { Logger } from '../lib/logger.js';
import { functionCall } from 'near-api-js/lib/transaction.js';
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair.js';

let _near: Near;
let _account: Account;
let _accountID: string;
let _accountKey: string;
let _contractID: string;
let _explorerBaseURL: string;
let _deposit: string;
let _vault: Vault;
let _vaultBaseUrl: string;
let _vaultContractAddress: string;

class Vault extends Account {

    public async LockNFTtoVault(payload: Payload): Promise<LockNFTtoVaultResult> {

        let keypair = KeyPairEd25519.fromRandom();
        let actions = [
            functionCall(
                'nft_transfer_call',
                {
                    receiver_id: _vaultContractAddress,
                    token_id: payload.TokenId,
                    msg: JSON.stringify({
                        public_key: keypair.publicKey.toString(),
                        message: `lock nft ${this.accountId}:${payload.TokenId} on vault`
                    })
                },
                40000000000000,
                "1"
            )
        ];

        let result = await this.signAndSendTransaction({
            receiverId: this.accountId,
            actions: actions
        });
        Logger().debug(`TransferToVault transaction result:\n${JSON.stringify(result)}`);

        let status = result.status as FinalExecutionStatus;

        if (status.Failure) {
            throw new Error(`Failed called to mint: ${status.Failure}`)
        }

        let claimDetails = {
            NFTContract: _accountID,
            PrivateKey: keypair.secretKey,
            TokenId: payload.TokenId,
            VaultContract: _vaultContractAddress
        } as ClaimDetails;

        let claimUrl = new URL(_vaultBaseUrl);
        claimUrl.pathname = `/claim/${claimDetails.NFTContract}/${claimDetails.TokenId}`
        claimUrl.hash = Buffer.from(JSON.stringify(claimDetails), 'utf-8').toString('base64')

        let transferToVaultResult = {
            ExplorerURL: `${_explorerBaseURL}/transactions/${result.transaction_outcome.id}`,
            TransactionId: result.transaction_outcome.id,
            ClaimURL: claimUrl.toString()
        } as LockNFTtoVaultResult;

        return transferToVaultResult;
    }
}

type LockNFTtoVaultResult = {
    ExplorerURL: string,
    TransactionId: string,
    ClaimURL: string,
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
    vaultBaseURL: string,
    vaultContractAddress: string
}

async function Init(connectConfig: ConnectConfig, initConfig: InitConfig) {
    _accountID = initConfig.accountID;
    _accountKey = initConfig.accountKey;
    _contractID = initConfig.contractID;
    _explorerBaseURL = `https://explorer.${connectConfig.networkId}.near.org`;
    _deposit = initConfig.deposit;
    _vaultBaseUrl = initConfig.vaultBaseURL;
    _vaultContractAddress = initConfig.vaultContractAddress;

    await connectConfig.keyStore?.setKey(connectConfig.networkId, _accountID, KeyPair.fromString(_accountKey))

    _near = await connect(connectConfig);
    _account = await _near.account(_accountID);
    _vault = new Vault(_near.connection, _accountID);
}

async function LockNFTtoVault(payload: Payload): Promise<LockNFTtoVaultResult> {
    return await _vault.LockNFTtoVault(payload);
}

export {
    Init,
    LockNFTtoVault,
    ClaimDetails
}

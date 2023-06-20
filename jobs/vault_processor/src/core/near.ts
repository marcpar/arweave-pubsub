import {
    connect, ConnectConfig, Near, KeyPair, Account, DEFAULT_FUNCTION_CALL_GAS, Contract, keyStores
} from 'near-api-js';
import { Payload } from '../queue/common.js';
import { FinalExecutionOutcome, FinalExecutionStatus } from 'near-api-js/lib/providers/index.js'
import { functionCall } from 'near-api-js/lib/transaction.js';
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair.js';
import { Logger } from 'lib/dist/util/logger.js';
import { KeyStore } from 'near-api-js/lib/key_stores/keystore.js';

let _near: Near;
let _account: Account;
let _accountID: string;
let _accountKey: string;
let _contractID: string;
let _explorerBaseURL: string;
let _deposit: string;
let _vaultBaseUrl: string;
let _vaultContractAddress: string;
let _keyStore: KeyStore;
let _keyPair: KeyPair;

type NFTContract = {
    nft_token: (args: {
        token_id: string
    }) => Promise<{
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
    }>
};

class Vault extends Account {

    public async LockNFTtoVault(payload: Payload, keypair: KeyPairEd25519): Promise<LockNFTtoVaultResult> {
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

        return this.processResult(payload, keypair, result);
    }

    public async RenewClaimable(payload: Payload, keypair: KeyPairEd25519): Promise<LockNFTtoVaultResult> {
        let actions = [
            functionCall(
                'renew_claimable',
                {
                    nft_account_id: payload.SmartContractId ?? this.accountId,
                    token_id: payload.TokenId,
                    public_key: keypair.publicKey.toString()
                },
                40000000000000,
                "1"
            )
        ];

        let result = await this.signAndSendTransaction({
            receiverId: _vaultContractAddress,
            actions: actions
        });
        return this.processResult(payload, keypair, result);
    }

    private async processResult(payload: Payload, keypair: KeyPairEd25519, result: FinalExecutionOutcome): Promise<LockNFTtoVaultResult> {
        Logger().debug(`TransferToVault transaction result:\n${JSON.stringify(result)}`);

        let status = result.status as FinalExecutionStatus;

        if (status.Failure) {
            throw new Error(`Failed called to mint: ${status.Failure}`)
        }

        let claimDetails = {
            NFTContract: this.accountId,
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

    _keyPair = KeyPair.fromString(_accountKey)
    if (!connectConfig.keyStore) {
        throw new Error(`Invalid keystore ${connectConfig.keyStore}`);
    }
    
    _keyStore = connectConfig.keyStore;
    //await connectConfig.keyStore?.setKey(connectConfig.networkId, _accountID, )

    _near = await connect(connectConfig);
    _account = await _near.account(_accountID);
    
    
}

async function LockNFTtoVault(payload: Payload): Promise<LockNFTtoVaultResult> {

    await _keyStore.setKey(_near.connection.networkId, payload.SmartContractId ?? _accountID, _keyPair);
    
    let _nftContract = new Contract(_account, payload.SmartContractId ?? _accountID, {
        changeMethods: [],
        viewMethods: ['nft_token']
    }) as any as NFTContract;

    let token = await _nftContract.nft_token({
        token_id: payload.TokenId
    });

    let keypair = KeyPairEd25519.fromRandom();

    let _vault = new Vault(_near.connection, payload.SmartContractId ?? _accountID);

    if (token.owner_id == _vaultContractAddress) {
        return await _vault.RenewClaimable(payload, keypair)
    }

    return await _vault.LockNFTtoVault(payload, keypair);
}

export {
    Init,
    LockNFTtoVault,
    ClaimDetails
}

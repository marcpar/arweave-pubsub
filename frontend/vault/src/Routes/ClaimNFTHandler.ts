import { ClaimDetails, GetVaultContract } from "../Libraries/Near/vault";
import * as nearAPI from 'near-api-js';
import { Dispatch, SetStateAction } from "react";
import { GetConnection, GetConfigInMemory, GetConfig } from "../Libraries/Near/connection";
import { NETWORK } from "../Libraries/Near/constants";

function ParseToken(token: string): ClaimDetails {
    let claimDetails!: ClaimDetails
    try {
        claimDetails = JSON.parse(Buffer.from(token, 'base64').toString("utf-8")) as ClaimDetails;
    } catch (e) {
        throw new Error(`Invalid token: ${e}`);
    }

    if (claimDetails.PrivateKey === null || claimDetails.PrivateKey === undefined) {
        throw new Error("invalid token");
    }
    return claimDetails;
}

const TIME_BEFORE_VALIDATE = 1000;
let currentTimeOut = setTimeout(() => {}, TIME_BEFORE_VALIDATE);
function AddressOnChangeHandler(setIsAddressValid: Dispatch<SetStateAction<boolean>>, address: string) {
    setIsAddressValid(false);
    clearTimeout(currentTimeOut);
    currentTimeOut = setTimeout(async () => {
        setIsAddressValid(await validateAddress(address));
    }, TIME_BEFORE_VALIDATE);
}

async function validateAddress(address: string): Promise<boolean> {
    if (address.length === 64) {
        for (let index = 0; index < address.length; index++) {
            let char = address.charCodeAt(index);
            // check a-f
            if (char >= 97 && char <= 102) {
                continue;
            }
            // check 0-9
            if (char >= 48 && char <= 57) {
                continue;
            }
            return false;
        }
        return true;
    }
    let conn = await GetConnection();
    try {
            let account = await conn.account(address);
            await account.state();
    } catch (e) {
        return false
    }
    return true;
}

async function SendHandler(receiver_id: string, nft_account_id: string, token_id: string , private_key: string) {
    
    let nearConfig = GetConfigInMemory(NETWORK);
    let keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    let accountId = process.env.REACT_APP_VAULT_CONTRACT as string ?? 'vault.world-triathlon.testnet';

    await keyStore.setKey(NETWORK, accountId, nearAPI.KeyPair.fromString(private_key));

    nearConfig.keyStore = keyStore;
    let conn = await nearAPI.connect(nearConfig);
    let vaultContract = GetVaultContract(await conn.account(accountId));

    let callback = NETWORK === 'mainnet'? `https://app.mynearwallet.com//nft-detail/${nft_account_id}/${token_id}` : `https://testnet.mynearwallet.com//nft-detail/${nft_account_id}/${token_id}`;
    
    await vaultContract.claim({
        callbackUrl: callback,
        args: {
            claimable_id: `${nft_account_id}:${token_id}`,
            receiver_id: receiver_id
        }, gas: "60000000000000"
    });
};

async function ClaimWithLoggedInAccountCallback(claimDetails: ClaimDetails) {
    let wallet = new nearAPI.WalletConnection(await nearAPI.connect(GetConfig(NETWORK)), '');
    if (!wallet.isSignedIn()) {
        throw new Error('wallet is not signed in');
    }

    await SendHandler(wallet.account().accountId, claimDetails.NFTContract, claimDetails.TokenId, claimDetails.PrivateKey);
    wallet.signOut();
}

async function ClaimWithExistingAccountHandler(claimDetailsId: string) {
    let wallet = new nearAPI.WalletConnection(await nearAPI.connect(GetConfig(NETWORK)), '');
    let currentLocation = window.location;
    let successRedirect = new URL(currentLocation.href);
    successRedirect.hash = '';
    successRedirect.pathname = `/claim-callback`;
    successRedirect.search = '';
    successRedirect.searchParams.set('claimDetailsId', claimDetailsId)
    successRedirect.protocol = currentLocation.protocol;
    wallet.signOut();
    wallet.requestSignIn({
        successUrl: successRedirect.toString()
    });
}

async function CreateNewAccountAndClaim(claimDetails: ClaimDetails, newAccountId: string, newPrivateKey: string, newPublicKey: string) {
    let nearConfig = GetConfigInMemory(NETWORK);
    let keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    let accountId = process.env.REACT_APP_VAULT_CONTRACT as string ?? 'vault.world-triathlon.testnet';

    await keyStore.setKey(NETWORK, accountId, nearAPI.KeyPair.fromString(claimDetails.PrivateKey));

    nearConfig.keyStore = keyStore;
    let conn = await nearAPI.connect(nearConfig);
    let vaultContract = GetVaultContract(await conn.account(accountId));

    let callback = NETWORK === 'mainnet'? `https://app.mynearwallet.com/auto-import-secret-key#${newAccountId}/${newPrivateKey}` : `https://testnet.mynearwallet.com/auto-import-secret-key#${newAccountId}/${newPrivateKey}`;
    
    await vaultContract.claim({
        callbackUrl: callback,
        args: {
            claimable_id: `${claimDetails.NFTContract}:${claimDetails.TokenId}`,
            receiver_id: newAccountId,
            new_public_key: newPublicKey
        }, gas: "60000000000000"
    });
}

export {
    ParseToken,
    AddressOnChangeHandler,
    SendHandler,
    ClaimWithExistingAccountHandler,
    ClaimWithLoggedInAccountCallback,
    CreateNewAccountAndClaim
}
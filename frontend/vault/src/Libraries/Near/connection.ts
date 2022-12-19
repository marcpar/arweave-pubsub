import * as nearAPI from 'near-api-js';
import { NETWORK } from './constants';

let _near: nearAPI.Near

function GetConfig(network: "mainnet" | "testnet"): nearAPI.ConnectConfig {
    switch(network) {
        case "mainnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.mainnet.near.org',
                keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
                walletUrl: 'https://app.mynearwallet.com',
                headers: {}

            };
        case "testnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.testnet.near.org',
                keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
                walletUrl: 'https://testnet.mynearwallet.com',
                headers: {}
            };
        default:
            throw new Error(`"Unsupported network ${network}`);
    }
}

function GetConfigInMemory(network: "mainnet" | "testnet"): nearAPI.ConnectConfig {
    switch(network) {
        case "mainnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.mainnet.near.org',
                keyStore: new nearAPI.keyStores.InMemoryKeyStore(),
                walletUrl: 'https://app.mynearwallet.com',
                headers: {}

            };
        case "testnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.testnet.near.org',
                keyStore: new nearAPI.keyStores.InMemoryKeyStore(),
                walletUrl: 'https://testnet.mynearwallet.com',
                headers: {}
            };
        default:
            throw new Error(`"Unsupported network ${network}`);
    }
}

async function GetConnection(config: nearAPI.ConnectConfig | undefined = undefined): Promise<nearAPI.Near> {
    if (_near) {
        return _near;
    }
    if (config === undefined) {
        throw Error('near config is undefined');
    }
    return _near = await nearAPI.connect(config);  
}

async function NewConnection(): Promise<nearAPI.Near> {
    return await nearAPI.connect(GetConfigInMemory(NETWORK));
}

export {
    GetConfig,
    GetConnection,
    GetConfigInMemory,
    NewConnection
}
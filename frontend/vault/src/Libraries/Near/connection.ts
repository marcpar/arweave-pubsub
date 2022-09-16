import * as nearAPI from 'near-api-js';

let _near: nearAPI.Near

function GetConfig(network: "mainnet" | "testnet"): nearAPI.ConnectConfig {
    switch(network) {
        case "mainnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.mainnet.near.org',
                keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
                walletUrl: 'https://wallet.near.org',

            };
        case "testnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.testnet.near.org',
                keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
                walletUrl: 'https://wallet.testnet.near.org',
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
                walletUrl: 'https://wallet.near.org',

            };
        case "testnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.testnet.near.org',
                keyStore: new nearAPI.keyStores.InMemoryKeyStore(),
                walletUrl: 'https://wallet.testnet.near.org',
            };
        default:
            throw new Error(`"Unsupported network ${network}`);
    }
}

async function GetConnection(config: nearAPI.ConnectConfig): Promise<nearAPI.Near> {
    if (_near) {
        return _near;
    }
    return _near = await nearAPI.connect(config);  
}

export {
    GetConfig,
    GetConnection,
    GetConfigInMemory
}
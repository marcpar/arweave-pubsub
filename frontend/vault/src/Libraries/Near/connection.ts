import { connect, ConnectConfig } from "near-api-js";
import { BrowserLocalStorageKeyStore } from "near-api-js/lib/key_stores";
import { Near, NearConfig } from "near-api-js/lib/near";

function GetConfig(network: "mainnet" | "testnet"): ConnectConfig {
    switch(network) {
        case "mainnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.mainnet.near.org',
                keyStore: new BrowserLocalStorageKeyStore(),
                walletUrl: 'https://wallet.near.org',

            };
        case "testnet":
            return {
                networkId: network,
                nodeUrl: 'https://rpc.testnet.near.org',
                keyStore: new BrowserLocalStorageKeyStore(),
                walletUrl: 'https://wallet.testnet.near.org',

            };
        default:
            throw new Error(`"Unsupported network ${network}`);
    }
}

async function GetConnection(config: ConnectConfig): Promise<Near> {
    return connect(config);
}

export {
    GetConfig,
    GetConnection
}
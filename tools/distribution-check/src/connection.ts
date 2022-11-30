import * as nearAPI from 'near-api-js';


async function GetNear(config: nearAPI.ConnectConfig): Promise<nearAPI.Near> {
     return await nearAPI.connect(config);  
}

function GetConfig(network: string): nearAPI.ConnectConfig {

    switch(network) {
        case 'mainnet':
            return {
                networkId: 'mainnet',
                nodeUrl: 'https://rpc.mainnet.near.org',
            };
        case 'testnet':
            return {
                networkId: 'testnet',
                nodeUrl: 'https://rpc.testnet.near.org'
            };
        default:
            throw new Error(`Network ${network} is not supported`);
    }
}

export {
    GetNear,
    GetConfig
}
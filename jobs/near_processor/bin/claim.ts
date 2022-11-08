import * as nearAPI from 'near-api-js';
import { GetConfig, LoadConfig } from '../src/config.js';

LoadConfig();
let config = GetConfig();

let key = 'ed25519:3fkNiKPpKDp1nA6gvB5h6CwzGpp8oRdt3NjQFQTrDXb6EkMFhB9DkF6LavYdXPsQkpo2UvzSaSGxNpAHczRPdr6C';
let keypair = nearAPI.KeyPair.fromString(key);
let accountId = config.VaultContractAddress;
let tokenId = 'd36a3b3d-d758-48ad-b971-5c33beaed0ed';
let receiver_id = '74b5704603733ced2a0752021534b17e96dca7f312ecb0ab9c60bc4af3ccfc0f';

let keyStore = new nearAPI.keyStores.InMemoryKeyStore();
(async () => {
    let conn = await nearAPI.connect({
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        keyStore: keyStore,
        headers: {}
    });
    
    keyStore.setKey('testnet', accountId, keypair);

    let result = await (await conn.account(accountId)).functionCall({
        contractId: accountId,
        methodName: 'claim',
        args: {
            receiver_id: receiver_id,
            claimable_id: `${config.NearAccountName}:${tokenId}`
        }
    });
    console.log(JSON.stringify(result));
})();



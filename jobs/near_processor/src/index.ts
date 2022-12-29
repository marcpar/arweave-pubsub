import { SetMaxJobs, SetQueue, Start } from './core/processor.js';
import { GetConfig, LoadConfig } from './config.js';
import { CreateAzureStorageQueue } from './queue/azure_storage_queue.js';

import { Logger } from './lib/logger.js';
import { SetDefaultCallBack } from './core/event.js';
import {
    Init,
} from './core/near.js';
import { InMemoryKeyStore } from 'near-api-js/lib/key_stores/in_memory_key_store.js';

LoadConfig();
let config = GetConfig();

(async () => {
    // ---- CONFIGURATION ---- //
    SetQueue(CreateAzureStorageQueue(config.AzureAccountName, config.AzureAccountKey, config.Topic));
    SetMaxJobs(config.MaxJobs);
    SetDefaultCallBack(config.DefaultCallbackURL);
    await Init({
        networkId: config.NearEnv,
        nodeUrl: config.NearEnv === "mainnet" ? 'https://rpc.mainnet.near.org' : 'https://rpc.testnet.near.org',
        headers: {},
        keyStore: new InMemoryKeyStore(),
    }, {
        accountID: config.NearAccountName,
        accountKey: config.NearAccountPrivateKey,
        contractID: config.NearMinterContractName,
        deposit: config.NearDeposit,
    });
    // ---- CONFIGURATION ---- //

    Logger().debug('Starting Processor');
    Start();
})();

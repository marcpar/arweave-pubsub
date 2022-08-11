import { SetMaxJobs, SetQueue, Start } from './core/processor.js';
import { GetConfig, LoadConfig } from './config.js';
import { CreateAzureStorageQueue } from './queue/azure_storage_queue.js';
import { SetArweaveWallet, SetMinConfirmations } from './core/arweave.js';

LoadConfig();
let config = GetConfig();

// ---- CONFIGURATION ---- //
SetQueue(CreateAzureStorageQueue(config.AzureAccountName, config.AzureAccountKey, config.Topic));
SetArweaveWallet(config.Wallet);
SetMinConfirmations(config.MinimumConfirmations);
SetMaxJobs(config.MaxJobs);
// ---- CONFIGURATION ---- //

Start();
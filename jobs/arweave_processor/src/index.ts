import { SetMaxJobs, SetQueue, Start } from './core/processor.js';
import { GetConfig, LoadConfig } from './config.js';
import { queue } from 'lib';
import { SetArweaveWallet, SetMinConfirmations } from './core/arweave.js';
import { util } from 'lib';
import { SetDefaultCallBack } from './core/event.js';

LoadConfig();
let config = GetConfig();

// ---- CONFIGURATION ---- //
SetQueue(queue.CreateAzureStorageQueue(config.AzureAccountName, config.AzureAccountKey, config.Topic));
SetArweaveWallet(config.Wallet);
SetMinConfirmations(config.MinimumConfirmations);
SetMaxJobs(config.MaxJobs);
SetDefaultCallBack(config.DefaultCallbackURL);
// ---- CONFIGURATION ---- //

util.Logger().debug('Starting Processor');
Start();
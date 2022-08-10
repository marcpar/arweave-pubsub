import { SetQueue, Start } from './core/processor.js';
import { GetConfig, LoadConfig } from './config.js';
import { CreateAzureStorageQueue } from './queue/azure_storage_queue.js';

LoadConfig();
let config = GetConfig();

SetQueue(CreateAzureStorageQueue(config.AzureAccountName, config.AzureAccountKey, config.Topic));

Start();
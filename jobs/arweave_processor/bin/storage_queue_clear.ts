import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";
import { util } from "lib";

LoadConfig();

let config = GetConfig();

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    let qClient = qsClient.getQueueClient(config.Topic);

    await qClient.createIfNotExists();
    let response = await qClient.clearMessages();
    util.Logger().info(response);
    
    
})();


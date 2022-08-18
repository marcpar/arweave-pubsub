import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";
import { Logger } from "../src/lib/logger.js";


LoadConfig();

let config = GetConfig();

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    let qClient = qsClient.getQueueClient(config.Topic);

    await qClient.createIfNotExists();
    let response = await qClient.peekMessages({
        numberOfMessages: 32
    });
    
    for (const item of response.peekedMessageItems) {
        Logger().info(JSON.stringify(item));
    }
})();


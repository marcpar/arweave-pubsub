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
    //let uuid = randomUUID();
    //let uuid ='02bc722d-f790-4d1c-aab6-a3394921c638';
    let job = {
        JobId: "ff975cbd-32f4-4f09-9b9a-01964dd6eb90",
        TokenId: "5ecf4af3-6464-44fd-b547-e59ba97fb9d4"
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


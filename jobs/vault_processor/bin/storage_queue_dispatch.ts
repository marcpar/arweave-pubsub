import { Logger } from "lib/dist/util/logger.js";
import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";


LoadConfig();

let config = GetConfig();
let tokenId = process.argv[2] ?? 'd1afef3e-f1ae-434f-85d9-3e367202244e';

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    let qClient = qsClient.getQueueClient(config.Topic);

    await qClient.createIfNotExists();
    //let uuid = randomUUID();
    //let uuid ='02bc722d-f790-4d1c-aab6-a3394921c638';
    let job = {
        JobId: "ff975cbd-32f4-4f09-9b9a-01964dd6eb90",
        TokenId: tokenId
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


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
        //OwnerAddress: "test-claimer.testnet",
        ArweaveTxnId: "BI4aHEJt4sOk-kGgUvZfWDO8mTswcNw0WZi7rN-J5D8", // mp4
        //ArweaveTxnId: "NxWWRUM8twj9hipCFm6WMt-a-cucoZoJ-zoSuSc8zso", // image
        Title: "Tilda Månsson - 2022 World Triathlon Cup Bergen",
        Description: "Tilda Månsson - 2022 World Triathlon Cup Bergen",
        Copies: 1,
        IssuedAt: "1660818999614",
        ExpiresAt: null,
        StartsAt: "1660818999614",
        UpdatedAt: "1660818999614"
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


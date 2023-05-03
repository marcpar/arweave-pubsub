import { Logger } from "lib/dist/util/index.js";
import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";


LoadConfig();

let config = GetConfig();

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    let qClient = qsClient.getQueueClient(config.Topic);

    await qClient.createIfNotExists();
    //let uuid = randomUUID();
    //let uuid ='02bc722d-f790-4d1c-aab6-a3394921c638';
    let time = new Date().getTime();
    let job = {
        JobId: "ff975cbd-32f4-4f09-9b9a-01964dd6eb90",
        //OwnerAddress: "test-claimer.testnet",
        ArweaveTxnId: "2ByKNNV6wxBa0MYh7kgQYXqstRKpe5rR9dTv-2lfLUE",
        Title: "Sarah Artese - 2023 World Triathlon Aquathlon Championships Ibiza",
        Description: "Sarah Artese - 2023 World Triathlon Aquathlon Championships Ibiza",
        Copies: 1,
        IssuedAt: `${time}}`,
        ExpiresAt: null,
        StartsAt:`${time}`,
        UpdatedAt: `${time}`
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


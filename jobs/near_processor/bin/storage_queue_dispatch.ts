import { GetConfig, LoadConfig } from "../src/config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";
import {
    randomUUID
} from 'crypto';
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
        ArweaveTxnId: "bhc5oP0C68Fz2bwJm2DGEc5uYN8J95tezDXBKE4yRz0",
        Title: "Samuel Dickinson - 2022 World Triathlon Sprint & Relay Championships Montreal",
        Description: "<TOKEN DESCRIPTION>",
        Copies: 1,
        IssuedAt: "1660818999614",
        ExpiresAt: null,
        StartsAt: "1660818999614",
        UpdatedAt: "1660818999614"
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


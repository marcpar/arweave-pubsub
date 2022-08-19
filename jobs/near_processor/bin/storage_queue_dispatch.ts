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
        ArweaveTxnId: "ZkUxju5Y5Goy-OXw2O-mj8T_T4JSUHb7sDUhUMLNlgg",
        Title: "Samuel Dickinson - 2022 World Triathlon Sprint & Relay Championships Montreal",
        Description: "<TOKEN DESCRIPTION>",
        Copies: 1,
        IssuedAt: "1660818999614",
        ExpiresAt: null,
        StartsAt: "1660818999614",
        UpdatedAt: "1660818999614",
        Metadata:'{"AthleteId":"106181","FirstName":"Samuel","LastName":"Dickinson","Country":"LAT","Status":"","StartNumber":"5","Position":3,"TotalTime":"00:28:32","Timings":[{"Key":"Swim","Value":"00:04:58"},{"Key":"T1","Value":"00:01:00"},{"Key":"Bike","Value":"00:14:29"},{"Key":"T2","Value":"00:00:29"},{"Key":"Run","Value":"00:07:36"}]}'
    }
    let response = await qClient.sendMessage(JSON.stringify(job));
    
    Logger().info(response.messageId);
})();


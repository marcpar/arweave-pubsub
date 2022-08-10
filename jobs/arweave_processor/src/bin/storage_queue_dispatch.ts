import { GetConfig, LoadConfig } from "../config.js";
import {
    QueueServiceClient,
    StorageSharedKeyCredential
} from "@azure/storage-queue";
import {
    randomUUID
} from 'crypto';


LoadConfig();

let config = GetConfig();

(async () => {
    let qsClient = new QueueServiceClient(`https://${config.AzureAccountName}.queue.core.windows.net`, new StorageSharedKeyCredential(config.AzureAccountName, config.AzureAccountKey));
    let qClient = qsClient.getQueueClient(config.Topic);

    await qClient.createIfNotExists();
    let response = await qClient.sendMessage(JSON.stringify(
        {"JobId": randomUUID(),"MediaURL":"https://nftdesignworks.blob.core.windows.net/mintedimages/4cd7f389-35ef-484f-a092-43a70b12206b.png","Metadata":{"AthleteId":"106181","FirstName":"Artjoms","LastName":"Gajevskis","Country":"LAT","Status":"","StartNumber":"5","Position":3,"TotalTime":"00:28:32","Timings":[{"Key":"Swim","Value":"00:04:58"},{"Key":"T1","Value":"00:01:00"},{"Key":"Bike","Value":"00:14:29"},{"Key":"T2","Value":"00:00:29"},{"Key":"Run","Value":"00:07:36"}]},"MinConfirmations":15,"CallbackURL":"https://localhost44349/confirm-upload"}
    ));
    
    console.log(response.messageId);
})();


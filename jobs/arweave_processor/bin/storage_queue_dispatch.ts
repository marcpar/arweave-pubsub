import { GetConfig, LoadConfig } from "../src/config.js";
import {
    logger,
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

    //let mediaURL = 'https://assets.entrepreneur.com/content/3x2/2000/1647397792-nft-art2.jpg';
    //let mediaURL = 'https://2upyoaui2v5jgeozo2curva64y5yp7aplcq6zw3f5kvo7xw7uy3q.arweave.net/1R-HAojVepMR2XaFSNQe5juH_A9YoezbZeqq797fpjc';
    let mediaURL = "https://testnftdesignworks.blob.core.windows.net/mintedimages/a21f7753-f107-4f49-8472-c328ddf9e322.mp4";
	let thumbnailURL = "https://testnftdesignworks.blob.core.windows.net/mintedimages/72989695-b7fe-4234-ac5b-95e9f6e48863.jpg";

    await qClient.createIfNotExists();
    //let uuid = randomUUID();
    //let uuid = '02bc722d-f790-4d1c-aab6-a3394921c638';
    let batch = new Array();
    for (let index = 0; index < 1; index++) {
        let uuid = randomUUID();
        let metadata = { "AthleteId": "106181", "FirstName": "Artjoms", "LastName": "Gajevskis", "Country": "LAT", "Status": "", "StartNumber": "5", "Position": 3, "TotalTime": "00:28:32", "Timings": [{ "Key": "Swim", "Value": "00:04:58" }, { "Key": "T1", "Value": "00:01:00" }, { "Key": "Bike", "Value": "00:14:29" }, { "Key": "T2", "Value": "00:00:29" }, { "Key": "Run", "Value": "00:07:36" }] };
        (metadata as any).uuid = uuid;
        batch.push({ "JobId": uuid, "MediaURL": mediaURL, "Metadata": metadata });
    }
    let response = await qClient.sendMessage(JSON.stringify(batch));

    Logger().info(response.messageId);
})();


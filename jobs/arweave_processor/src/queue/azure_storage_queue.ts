import { DequeuedMessageItem, QueueServiceClient, StorageSharedKeyCredential } from "@azure/storage-queue";
import { Sleep } from "../lib/util.js";
import { Job, Queue } from "./common.js";


const STORAGE_QUEUE_POLL_INTERVAL = 3000;
const STORAGE_QUEUE_RENEW_LOCK_INTERVAL = 20000;

function CreateAzureStorageQueue(accountName: string, accountKey: string, queueName: string): Queue {
    let qsClient = new QueueServiceClient(
        `https://${accountName}.queue.core.windows.net`,
        new StorageSharedKeyCredential(accountName, accountKey)
    );

    let qClient = qsClient.getQueueClient(queueName);

    let queue: Queue = {
        async getNextJob(): Promise<Job> {
            
            return new Promise<Job>(async (resolve) => {
                await qClient.createIfNotExists();
                let currentMessage: DequeuedMessageItem;
                do {
                    console.log(`fetching message`);
                    let msgResponse = await qClient.receiveMessages({});
                    
                    currentMessage = msgResponse.receivedMessageItems.pop() as DequeuedMessageItem;
                    if (currentMessage) {
                        console.log(`message received: ${currentMessage.messageId} : ${currentMessage.popReceipt}`)

                        let renewLockInterval = setInterval(async () => {
                            console.log(`renewing visibility for message: ${currentMessage.messageId}`)
                            let response = await qClient.updateMessage(currentMessage.messageId, currentMessage.popReceipt, undefined, 30);
                            console.log(response);
                            currentMessage.popReceipt = response.popReceipt ?? currentMessage.popReceipt;
                        }, STORAGE_QUEUE_RENEW_LOCK_INTERVAL);

                        resolve({
                            payload: JSON.parse(currentMessage.messageText),
                            async complete() {
                                clearInterval(renewLockInterval);
                                await qClient.deleteMessage(currentMessage.messageId, currentMessage.popReceipt);
                            },
                        });

                        break;
                    }
                    console.log(`none received, sleeping for ${STORAGE_QUEUE_POLL_INTERVAL}ms`);
                    await Sleep(STORAGE_QUEUE_POLL_INTERVAL);
                } while (currentMessage === undefined);
            });
        },
    };

    return queue;
}

export {
    CreateAzureStorageQueue
}
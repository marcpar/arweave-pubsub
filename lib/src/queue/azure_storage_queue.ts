import { DequeuedMessageItem, QueueServiceClient, StorageSharedKeyCredential } from "@azure/storage-queue";
import { Logger, Sleep } from "../util/index.js";
import { Queue } from "./common.js";

const STORAGE_QUEUE_POLL_INTERVAL = 3000;

function CreateAzureStorageQueue(accountName: string, accountKey: string, queueName: string): Queue<string> {
    let qsClient = new QueueServiceClient(
        `https://${accountName}.queue.core.windows.net`,
        new StorageSharedKeyCredential(accountName, accountKey)
    );

    let qClient = qsClient.getQueueClient(queueName);

    let queue: Queue<string> = {
        async getNextJob(): Promise<string> {
            return new Promise<string>(async (resolve, reject) => {
                await qClient.createIfNotExists();
                let currentMessage: DequeuedMessageItem | undefined;
                do {
                    Logger().debug('fetching messages from storage queue');
                    let msgResponse = await qClient.receiveMessages({});
                    currentMessage = msgResponse.receivedMessageItems.pop();
                    if (currentMessage) {
                        Logger().info(`message received: ${currentMessage.messageId} : ${currentMessage.popReceipt}`)
                        await qClient.deleteMessage(currentMessage.messageId, currentMessage.popReceipt);
                        resolve(currentMessage.messageText);
                        break;
                    }
                    Logger().debug(`none received, sleeping for ${STORAGE_QUEUE_POLL_INTERVAL}ms`);
                    await Sleep(STORAGE_QUEUE_POLL_INTERVAL);
                } while (!currentMessage);
            });
        },
    };

    return queue;
}

export {
    CreateAzureStorageQueue
}
import { DequeuedMessageItem, QueueServiceClient, StorageSharedKeyCredential } from "@azure/storage-queue";
import { Emit } from "../core/event.js";
import { Logger } from "../lib/logger.js";
import { Sleep } from "../lib/util.js";
import { Job, ParsePayloadFromJSONString, Payload, Queue } from "./common.js";


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

            return new Promise<Job>(async (resolve, reject) => {
                await qClient.createIfNotExists();
                let currentMessage: DequeuedMessageItem;
                do {
                    Logger().debug('fetching messages from storage queue');
                    let msgResponse = await qClient.receiveMessages({});

                    currentMessage = msgResponse.receivedMessageItems.pop() as DequeuedMessageItem;
                    if (currentMessage) {
                        Logger().info(`message received: ${currentMessage.messageId} : ${currentMessage.popReceipt}`)

                        let renewLockInterval = setInterval(async () => {
                            Logger().debug(`renewing lock for message: ${currentMessage.messageId}`)
                            let response = await qClient.updateMessage(currentMessage.messageId, currentMessage.popReceipt, undefined, 30);
                            currentMessage.popReceipt = response.popReceipt ?? currentMessage.popReceipt;
                        }, STORAGE_QUEUE_RENEW_LOCK_INTERVAL);

                        let parseResult = ParsePayloadFromJSONString(currentMessage.messageText);
                        if (parseResult.Error !== undefined && parseResult.Error !== null || parseResult.Payload === null) {
                            clearInterval(renewLockInterval);
                            Emit({
                                Event: 'failure',
                                JobId: parseResult.Payload?.JobId ?? '',
                                Message: `Failed to parse payload: ${parseResult.Error}`
                            });
                            reject(parseResult.Error);
                            break;
                        }
                        let payload = JSON.parse(currentMessage.messageText) as Payload;

                        resolve({
                            payload: payload,
                            async complete() {
                                clearInterval(renewLockInterval);
                                await qClient.deleteMessage(currentMessage.messageId, currentMessage.popReceipt);
                            },
                            async requeue() {
                                clearInterval(renewLockInterval);
                            }
                        });

                        break;
                    }
                    Logger().debug(`none received, sleeping for ${STORAGE_QUEUE_POLL_INTERVAL}ms`);
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
import { ParsePayloadFromJSONString, Payload } from '../queue/payload.js';
import axios, { AxiosError } from 'axios';
import { util } from 'lib';
import { ConfirmUpload, UploadMediaToPermaweb, UploadParams } from './arweave.js';
import { Emit } from './event.js';
import { queue } from 'lib'

const Logger = util.Logger;
const Sleep = util.Sleep;
const withRetry = util.withRetry;
type Queue = queue.Queue<string>;

let _queue: Queue;

/**
 * Number of jobs currently being processed
 */
let _processing: number = 0;

/**
 * Maximum number of jobs that will be processed
 */
let _maxProcessingJobs = 0;

function SetQueue(queue: queue.Queue<string>) {
    _queue = queue;
}

function SetMaxJobs(maxJobs: number) {
    _maxProcessingJobs = maxJobs;
}

async function Start() {
    // main processor  loop
    while (true) {
        await loop();
    }
}

async function loop() {
    if (_maxProcessingJobs > 0 && _processing >= _maxProcessingJobs) {
        Logger().debug(`throttling processing ${_processing} jobs`);
        await Sleep(5000);
        return;
    }
    let payload!: Payload[];
    try {
        let result = ParsePayloadFromJSONString(await _queue.getNextJob());
        if (result.Error) {
            throw new Error(`${result.Error}`)
        } else if (result.Payload) {
            payload = result.Payload;
        } else {
            throw new Error(`Failed to parse payload: payload is ${result.Payload}`)
        }
    } catch (e) {
        Logger().error(e);
        return;
    }

    _processing++;
    (async () => {
        await processJob(payload);
    })().then(async () => {
    }).catch(async (e) => {
        let err = e as Error;
        for (const _payload of payload) {
            let err_message = `Requeing job ${_payload.JobId}, failed due to error: ${err.message}\n${err.stack ?? ''}`;
            Logger().error(err_message, {
                log_type: 'job_failed',
                job_id: _payload.JobId
            });
            Emit({
                JobId: _payload.JobId,
                Event: "failure",
                Message: err_message,
                Details: {
                    Error: err,
                }
            }).catch(e => {
                Logger().error(`Failed to send failure message to callback: ${e}`);
            });
        }
    }).finally(() => {
        _processing--;
    });
}

async function processJob(payload: Payload[]) {

    let uploadParams: UploadParams[] = []

    for (const _payload of payload) {
        let emitResult = await Emit({
            JobId: _payload.JobId,
            Event: "started",
            Message: `Job ${_payload.JobId} has been started`
        });
        if (emitResult === "not_found" || emitResult === "error") {
            Logger().warn(`callback endpoint failed with emit result ${emitResult}, removing the job from queue`);
            return;
        }
        Logger().info(`Job ${_payload.JobId} has been started`, {
            log_type: 'job_started',
            job_id: _payload.JobId
        });
        try {
            let mediaResponse = await withRetry(() => {
                return axios.default.get<Buffer>(_payload.MediaURL, {
                    responseType: "arraybuffer"
                });
            }, 10);
            let thumbnailData: Buffer | undefined;
            if (_payload.ThumbnailURL) {
                let thumbnailResponse = await withRetry(() => {
                    return axios.default.get<Buffer>(_payload.ThumbnailURL as any, {
                        responseType: 'arraybuffer'
                    })
                }, 10);
                thumbnailData = thumbnailResponse.data;
            }
            uploadParams.push({
                jobID: _payload.JobId,
                media: mediaResponse.data,
                metadata: _payload.Metadata,
                thumbnail: thumbnailData
            });
        } catch (e) {
            Logger().error(e);
            let _e = e as AxiosError;
            throw Error(`Failed to download media for JobID ${_payload.JobId} with error: ${_e}`);
        }
    }

    let result = await UploadMediaToPermaweb(uploadParams);
    let bundleTxID = result.BundleTxID;

    let confirmations = await withRetry(() => {
        return ConfirmUpload(bundleTxID);
    }, 10);

    for (const _payload of payload) {
        Logger().info(`Job ${_payload.JobId} has been successfully submitted: ${bundleTxID}`, {
            log_type: 'job_completed',
            job_id: _payload.JobId
        });

        await Emit({
            JobId: _payload.JobId,
            Event: "submitted",
            Message: `Job ${_payload.JobId} has been successfully submitted: ${bundleTxID}`,
            Details: {
                TransactionID: result.JobIDPathManifestID[_payload.JobId],
                Confirmations: confirmations
            }
        })
    }
}

export {
    Start,
    SetQueue,
    SetMaxJobs
}
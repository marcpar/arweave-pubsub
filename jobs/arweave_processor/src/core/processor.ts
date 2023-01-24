import { Job, JobIDStateMap, Payload, Queue, State } from '../queue/common.js';
import axios from 'axios';
import { Sleep } from '../lib/util.js';
import { ConfirmUpload, UploadMediaToPermaweb, UploadParams } from './arweave.js';
import { Logger } from '../lib/logger.js';
import { Emit } from './event.js';

let _queue: Queue;

/**
 * Number of jobs currently being processed
 */
let _processing: number = 0;

/**
 * Maximum number of jobs that will be processed
 */
let _maxProcessingJobs = 0;

function SetQueue(queue: Queue) {
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
    let job!: Job;
    try {
        job = await _queue.getNextJob();
    } catch (e) {
        Logger().error(e);
        return;
    }

    _processing++;
    (async () => {
        await processJob(job);
    })().then(async () => {
        await job.complete();
    }).catch(async (e) => {
        await job.requeue();
        let err = e as Error;
        for (const payload of job.payload) {
            let err_message = `Requeing job ${payload.JobId}, failed due to error: ${err.message}\n${err.stack ?? ''}`;
            Logger().error(err_message, {
                log_type: 'job_failed',
                job_id: payload.JobId
            });
            Emit({
                JobId: payload.JobId,
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

async function processJob(job: Job) {
    
    let payload = job.payload;
    let bundleTxID = undefined;
    let state: JobIDStateMap = {};

    for (const _payload of payload) {
        if (!_payload.State || !_payload.State.BundleTxID ||!_payload.State.PathManifestTxID) {
            break;
        } 
        bundleTxID = _payload.State.BundleTxID;
        state[_payload.JobId] = _payload.State;
    }
    
    if (!bundleTxID) {
        let uploadParams: UploadParams[] = []
        let downloadPromises: Promise<void>[] = [];
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

            downloadPromises.push(axios.default.get<Buffer>(_payload.MediaURL, {
                responseType: "arraybuffer"
            }).then((response) => {
                uploadParams.push({
                    jobID: _payload.JobId,
                    media: response.data,
                    metadata: _payload.Metadata
                });
            }));
        }
        try {
            
            await Promise.all(downloadPromises);
        } catch(e) {
            Logger().error(e);
            throw e;
        }
        
        let result = await UploadMediaToPermaweb(uploadParams);

        bundleTxID = result.BundleTxID;
        for (const jobID in result.JobIDPathManifestID) {
            state[jobID] = {
                BundleTxID: bundleTxID,
                PathManifestTxID: result.JobIDPathManifestID[jobID]
            }
        }

        await job.setState(state);
    } else {
        for (const _payload of payload) {
            let emitResult = await Emit({
                JobId: _payload.JobId,
                Event: "started",
                Message: `Job ${_payload.JobId} has been restarted`
            });
    
            if (emitResult === "not_found" || emitResult === "error") {
                Logger().warn(`callback endpoint failed with emit result ${emitResult}, removing the job from queue`);
                return;
            }
    
            Logger().info(`Job ${_payload.JobId} has been restarted`, {
                log_type: 'job_restarted',
                job_id: _payload.JobId
            });
    
        }
    }

    let confirmations = await ConfirmUpload(bundleTxID);

    for (const _payload of payload) {
        Logger().info(`Job ${_payload.JobId} has been successfully processed: ${bundleTxID}`, {
            log_type: 'job_completed',
            job_id: _payload.JobId
        });
        await Emit({
            JobId: _payload.JobId,
            Event: "success",
            Message: `Job ${_payload.JobId} has been successfully processed: ${bundleTxID}`,
            Details: {
                TransactionID: state[_payload.JobId].PathManifestTxID,
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
import { Logger } from 'lib/dist/util/logger.js';
import { ParsePayloadFromJSONString, Payload } from '../queue/common.js';
import { Emit } from './event.js';
import { LockNFTtoVault } from './near.js';
import { Queue } from 'lib/dist/queue/common.js';
import { Sleep } from 'lib/dist/util/sleep.js';
import { withRetry } from 'lib/dist/util/retry.js';

let _queue: Queue<string>;

/**
 * Number of jobs currently being processed
 */
let _processing: number = 0;

/**
 * Maximum number of jobs that will be processed
 */
let _maxProcessingJobs = 0;

function SetQueue(queue: Queue<string>) {
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
    let payload!: Payload;
    try {
        let result = ParsePayloadFromJSONString(await _queue.getNextJob());
        if (result.Error) {
            Logger().error(`failed to parse payload from json due to error: ${result.Error}`);
            if (result.Payload && result.Payload.JobId) {
                Emit({
                    Event: 'failure',
                    JobId: result.Payload.JobId,
                    Message: `failed to parse payload from json due to error: ${result.Error}`,
                    Details: result
                })
            }
            return;
        }
        payload = result.Payload as Payload;
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
        let err_message = `Job ${payload.JobId} failed due to error: ${err.message}\n${err.stack ?? ''}\n${JSON.stringify(err)}`
        Logger().error(err_message, {
            log_type: 'job_failed',
            job_id: payload.JobId,
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
    }).finally(() => {
        _processing--;
    });
}

async function processJob(payload: Payload) {
    Logger().info(`Job ${payload.JobId} received`, {
        log_type: 'job_started',
        job_id: payload.JobId
    });
    let emitResult = await Emit({
        JobId: payload.JobId,
        Event: 'started',
        Message: `Job ${payload.JobId} has been received and started`,
    });

    if (emitResult === "not_found" || emitResult === "error") {
        Logger().warn(`callback endpoint failed with emit result ${emitResult}, removing the job from queue`);
        return;
    }

    let result = await withRetry(async () => {
        return await LockNFTtoVault(payload)
    }, 5);

    Logger().info(`Job ${payload.JobId} has been successfully processed`, {
        log_type: 'job_completed',
        job_id: payload.JobId
    });
    Emit({
        JobId: payload.JobId,
        Event: "success",
        Message: `Job ${payload.JobId} has been successfully processed`,
        Details: result
    }).catch((e) => {
        Logger().warn(`JobId: ${payload.JobId}: Failed to send callback: ${JSON.stringify(e)}`);
    });
}

export {
    Start,
    SetQueue,
    SetMaxJobs
}
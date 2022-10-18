import { Job, Payload, Queue } from '../queue/common.js';
import axios from 'axios';
import { Sleep } from '../lib/util.js';
import { Logger } from '../lib/logger.js';
import { Emit } from './event.js';
import { Mint } from './near.js';

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
    let job = await _queue.getNextJob();
    _processing++;
    (async () => {
        await processJob(job);
    })().then(async () => {
        await job.complete();
    }).catch(async (e) => {
        await job.requeue();
        let err = e as Error;
        let err_message = `Job ${job.payload.JobId} failed due to error: ${err.message}\n${err.stack ?? ''}\n${JSON.stringify(err)}`
        Logger().error(err_message, {
            log_type: 'job_failed',
            job_id: job.payload.JobId,
        });
        Emit({
            JobId: job.payload.JobId,
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

async function processJob(job: Job) {
    let payload = job.payload;
    Logger().info(`Job ${payload.JobId} received`, {
        log_type: 'job_started',
        job_id: job.payload.JobId
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

    let result = await Mint(payload);
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
import { Job, Payload, Queue } from '../queue/common.js';
import axios from 'axios';
import { Sleep } from '../lib/util.js';
import { ConfirmUpload, UploadMediaToPermaweb } from './arweave.js';
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
    let job = await _queue.getNextJob();
    _processing++;
    (async () => {
        await processJob(job);
    })().then(async () => {
        await job.complete();
    }).catch(async (e) => {
        await job.requeue();
        let err = e as Error;
        let err_message = `Requeing job ${job.payload.JobId}, failed due to error: ${err.message}\n${err.stack ?? ''}`;
        Logger().error(err_message, {
            log_type: 'job_failed',
            job_id: job.payload.JobId
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
    let txID: string | undefined = undefined;
    let manifestTxID: string | undefined = undefined;
    let payload = job.payload;

    if (payload.State && payload.State.TxID && payload.State.PathManifestTxID) {
        txID = payload.State.TxID;
        manifestTxID = payload.State.PathManifestTxID;
    }

    if (!txID) {

        await Emit({
            JobId: job.payload.JobId,
            Event: "started",
            Message: `Job ${job.payload.JobId} has been started`
        });
        Logger().info(`Job ${job.payload.JobId} has been started`, {
            log_type: 'job_started',
            job_id: job.payload.JobId
        });

        let response = await axios.default.get<Buffer>(payload.MediaURL, {
            responseType: "arraybuffer"
        });

        if (response.status !== 200) {
            throw new Error(`Failure while trying to download media returned status: ${response.status}\n${response.data}`)
        }

        let result = await UploadMediaToPermaweb(response.data, payload.Metadata,payload.JobId);
        txID = result.BundleTxID;
        manifestTxID = result.PathManifestTxID;

        await job.setState({
            TxID: txID,
            PathManifestTxID: manifestTxID
        });
    } else {
        await Emit({
            JobId: job.payload.JobId,
            Event: "started",
            Message: `Job ${job.payload.JobId} has been restarted`
        });
        Logger().info(`Job ${job.payload.JobId} has been restarted`, {
            log_type: 'job_restarted',
            job_id: job.payload.JobId
        });
    }

    let confirmations = await ConfirmUpload(txID, payload.MinConfirmations);

    Logger().info(`Job ${payload.JobId} has been successfully processed: ${txID}`, {
        log_type: 'job_completed',
        job_id: job.payload.JobId
    });
    await Emit({
        JobId: payload.JobId,
        Event: "success",
        Message: `Job ${payload.JobId} has been successfully processed: ${txID}`,
        Details: {
            TransactionID: manifestTxID,
            Confirmations: confirmations
        }
    })
}

export {
    Start,
    SetQueue,
    SetMaxJobs
}
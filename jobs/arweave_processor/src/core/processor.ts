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
        try {
            await processJob(job);
        } catch (e) {
            let err = e as Error;
            Emit({
                JobId: job.payload.JobId,
                Event: "failure",
                Message: `Job ${job.payload.JobId} failed due to error: ${err.message}\n${err.stack ?? ''}`,
                Details: {
                    Error: e,
                }
            }, job.payload.CallbackURL)
            Logger().error(`Job ${job.payload.JobId} failed due to error: ${err.message}\n${err.stack ?? ''}`);
        }

        await job.complete();
        _processing--;
    })();

}

async function processJob(job: Job) {
    let txID: string | undefined = undefined;
    let payload = job.payload;

    if (payload.State && payload.State.TxID) {
        txID = payload.State.TxID;
    }

    if (!txID) {

        Emit({
            JobId: job.payload.JobId,
            Event: "started",
            Message: `Job ${job.payload.JobId} has been started`
        }, job.payload.CallbackURL);

        let response = await axios.default.get<Buffer>(payload.MediaURL, {
            responseType: "arraybuffer"
        });

        if (response.status !== 200) {
            throw new Error(`Failure while trying to download media returned status: ${response.status}\n${response.data}`)
        }

        txID = await UploadMediaToPermaweb(response.data, payload.JobId);

        await job.setState({
            TxID: txID
        });
    }

    let confirmations = await ConfirmUpload(txID, payload.MinConfirmations);

    Logger().info(`Job ${payload.JobId} has been successfully processed: ${txID}`);
    Emit({
        JobId: payload.JobId,
        Event: "success",
        Message: `Job ${payload.JobId} has been successfully processed: ${txID}`,
        Details: {
            TransactionID: txID,
            Confirmations: confirmations
        
        }
    })
}

export {
    Start,
    SetQueue,
    SetMaxJobs
}
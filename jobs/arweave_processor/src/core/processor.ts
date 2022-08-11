import { Job, Payload, Queue } from '../queue/common.js';
import axios from 'axios';
import { Sleep } from '../lib/util.js';
import { ConfirmUpload, UploadMediaToPermaweb } from './arweave.js';


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
        console.log(`throttling processing ${_processing} jobs`);
        await Sleep(5000);
        return;
    }

    let job = await _queue.getNextJob();

    _processing++;
    (async () => {
        try {
            await processJob(job);
        } catch (e) {
            // @TODO notify failure
            console.error(e);
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
        let response = await axios.default.get<Buffer>(payload.MediaURL,  {
            responseType: "arraybuffer"
        });
    
        if (response.status !== 200) {
            throw new Error(`Failure while trying to download media returned status: ${response.status}\n${response.data}`)
        }

        txID = await UploadMediaToPermaweb(response.data, payload.JobId);

        await job.updateState({
            TxID: txID
        });
    }
    
    await ConfirmUpload(txID, payload.MinConfirmations);

    // @TODO notify on success
    console.log(`job ${payload.JobId} successfully processed: ${txID}`);
}

export {
    Start,
    SetQueue,
    SetMaxJobs
}
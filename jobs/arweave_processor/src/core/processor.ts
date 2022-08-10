import { Sleep } from '../lib/util.js';
import { Queue } from '../queue/common.js';


let _queue: Queue;
function SetQueue(queue: Queue) {
    _queue = queue;
}

async function Start() {
    // main processor  loop
    while (true) {
        await loop()
    }
}

async function loop() {
    let job = await _queue.getNextJob();
    console.log(`processing job: ${JSON.stringify(job.payload)}`);
    await Sleep(40000);
    console.log('job complete');
    await job.complete();
}

export {
    Start,
    SetQueue
}
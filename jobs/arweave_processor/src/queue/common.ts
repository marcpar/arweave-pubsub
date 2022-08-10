interface Queue {
    getNextJob: () => Promise<Job>
}

interface Job {
    payload: Payload
    complete: () => Promise<void>
}

type Payload = {
    JobId: string,
    MediaURL: string,
    Metadata?: object;
    MinConfirmations?: number,
    CallbackURL?: string,
}

export {
    Queue,
    Job,
    Payload
}
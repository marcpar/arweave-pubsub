interface Queue {
    getNextJob: () => Promise<Job>
}

interface Job {
    payload: Payload
    complete: () => Promise<void>,
    setState: (state: State) => Promise<void>,
    requeue: () => Promise<void>
}

type Payload = {
    JobId: string,
    MediaURL: string,
    MinConfirmations?: number,
    State?: State
}

type State = {
    TxID?: string,
}

export {
    Queue,
    Job,
    Payload
}
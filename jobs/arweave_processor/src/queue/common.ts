interface Queue {
    getNextJob: () => Promise<Job>
}

interface Job {
    payload: Payload
    complete: () => Promise<void>,
    setState: (state: State) => Promise<void>,
}

type Payload = {
    JobId: string,
    MediaURL: string,
    Metadata?: object;
    MinConfirmations?: number,
    CallbackURL?: string,
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
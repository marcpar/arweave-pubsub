interface Queue {
    getNextJob: () => Promise<Job>
}

interface Job {
    payload: Payload
    complete: () => Promise<void>,
    requeue: () => Promise<void>
}

type Payload = {
    JobId: string,
    ArweaveTxnId: string,
    Title?: string,
    Description?: string,
    Copies?: number,
    IssuedAt?: string,
    ExpiresAt?: string,
    StartsAt?: string,
    UpdatedAt?: string,
}

export {
    Queue,
    Job,
    Payload
}
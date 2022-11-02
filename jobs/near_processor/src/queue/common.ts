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
    OwnerAddress?: string,
    Title?: string,
    Description?: string,
    Copies?: number,
    IssuedAt?: string,
    ExpiresAt?: string,
    StartsAt?: string,
    UpdatedAt?: string,
}

function ParsePayloadFromJSONString(payloadString: string): {
    Payload: Payload | null,
    Error: string | null
} {
    let payload = JSON.parse(payloadString) as Payload;

    if (payload.JobId === undefined || payload.JobId === null) {
        return {
            Payload: payload,
            Error: "JobId is a required parameter"
        };
    }

    if (payload.ArweaveTxnId === undefined || payload.ArweaveTxnId === null) {
        return {
            Payload: payload,
            Error: "ArweaveTxnId is a required parameter"
        };
    }

    return {
        Payload: payload,
        Error: null
    };
}

export {
    Queue,
    Job,
    Payload,
    ParsePayloadFromJSONString
}
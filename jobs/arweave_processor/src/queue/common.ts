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
    Metadata: any,
    MinConfirmations?: number,
    State?: State
}

type State = {
    TxID?: string,
    PathManifestTxID?: string,
}

function ParsePayloadFromJSONString(payloadString: string): {
    Payload: Payload | null,
    Error: String | null
} {
    let payload: Payload
    try {
        payload = JSON.parse(payloadString);
    } catch (e) {
        return {
            Payload: null,
            Error: `failed to parse payload: ${(e as Error).message}`
        }
    }
    
    if (payload.JobId === null || payload.JobId === undefined) {
        return {
            Payload: payload,
            Error: "JobId is a required parameter"
        }
    }

    if (payload.Metadata === null || payload.Metadata === undefined) {
        return {
            Payload: payload,
            Error: "Metadata is a required parameter"
        };
    }

    if (payload.MediaURL === null || payload.MediaURL === undefined) {
        return {
            Payload: payload,
            Error: "MediaURL is a required parameter"
        };
    }

    try {
        new URL(payload.MediaURL);
    } catch (e) {
        return {
            Payload: payload,
            Error: `MediaURL should be a valid url: ${(e as Error).message}`
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
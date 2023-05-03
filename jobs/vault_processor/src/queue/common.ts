type Payload = {
    JobId: string,
    TokenId: string
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

    if (payload.TokenId === undefined || payload.TokenId === null) {
        return {
            Payload: payload,
            Error: "TokenId is a required parameter"
        };
    }

    return {
        Payload: payload,
        Error: null
    };
}

export {
    Payload,
    ParsePayloadFromJSONString
}
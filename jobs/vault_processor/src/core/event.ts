import axios from "axios";
import { Logger } from "lib/dist/util/logger.js";
import { withRetry } from "lib/dist/util/retry.js";

let _callbackURL: string;
let _client = axios.default;

function SetDefaultCallBack(callback: string) {
    _callbackURL = callback;
}

interface Event {
    JobId: string,
    Event: "started" | "failure" | "success",
    Message: string,
    Details?: any
}

interface _Event extends Event {
    Time: number
}

type EmitResult = "ok" | "not_found" | "error";

async function Emit(event: Event): Promise<EmitResult> {
    let _event = event as _Event;
    _event.Time = new Date().getTime();
    let response = await withRetry(async () => {
        return await _client.post(_callbackURL, _event);
    }, 10)
    Logger().debug(`callback reponse: ${response.status}\n${JSON.stringify(response.data)}`);

    if ([400, "400"].includes(response.data)) {
        return "error";
    }

    if ([404, "404"].includes(response.data)) {
        return "not_found";
    }

    if (![true, "true", 200, "200"].includes(response.data)) {
        throw new Error(`Callback endpoint unexpected response ${response.data}, should be true or 200`);
    }

    return "ok";
}

export {
    Emit,
    SetDefaultCallBack,
    Event
}
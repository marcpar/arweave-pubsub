import axios from "axios";
import { Logger } from "../lib/logger.js";

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

async function Emit(event: Event): Promise<void> {
    let _event = event as _Event;
    _event.Time = new Date().getTime();
    Logger().debug(JSON.stringify(_event));
    return;
    let response = await _client.post(_callbackURL, _event);
    Logger().debug(`callback response fror ${JSON.stringify(event)}: ${response.status}\n${JSON.stringify(response.data)}`);
    if (![true, "true", 200, "200"].includes(response.data)) {
        throw new Error(`Callback endpoint unexpected response ${response.data}, should be true or 200`);
    }
}

export {
    Emit,
    SetDefaultCallBack,
    Event
}
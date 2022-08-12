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

function Emit(event: Event, callbackURL?: string) {
    let cbURL = callbackURL ?? _callbackURL;
    let _event = event as _Event;
    _event.Time = new Date().getTime();
    _client.post(cbURL, _event).then(response => {
        Logger().debug(`callback reponse: ${response.status}\n${JSON.stringify(response.data)}`);
    }).catch(error => {
        Logger().error(`callback error: ${error}`);
    });
}

export {
    Emit,
    SetDefaultCallBack,
    Event
}
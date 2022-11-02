import { equal } from "assert";
import { ParsePayloadFromJSONString, Payload } from "../src/queue/common.js";

describe("test", () => {
    it("should pass", () => {
        equal(true, true);
    });
});

describe("Payload Validation", () => {
    it("should be able parse valid payload", () => {
        let payloadString = JSON.stringify({
            ArweaveTxnId: "",
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, null);
    });

    it("should fail on undefined JobId", () => {
        let payloadString = JSON.stringify({
            ArweaveTxnId: "",
            JobId: undefined as any,
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on null JobId", () => {
        let payloadString = JSON.stringify({
            ArweaveTxnId: "",
            JobId: null as any,
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on undefined ArweaveTxnId", () => {
        let payloadString = JSON.stringify({
            ArweaveTxnId: undefined as any,
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "ArweaveTxnId is a required parameter");
    });

    it("should fail on null ArweaveTxnId", () => {
        let payloadString = JSON.stringify({
            ArweaveTxnId: null as any,
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "ArweaveTxnId is a required parameter");
    });
});
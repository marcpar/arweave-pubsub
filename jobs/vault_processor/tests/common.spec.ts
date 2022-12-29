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
            TokenId: "",
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, null);
    });

    it("should fail on undefined JobId", () => {
        let payloadString = JSON.stringify({
            TokenId: "",
            JobId: undefined as any,
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on null JobId", () => {
        let payloadString = JSON.stringify({
            TokenId: "",
            JobId: null as any,
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on undefined TokenId", () => {
        let payloadString = JSON.stringify({
            TokenId: undefined as any,
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "TokenId is a required parameter");
    });

    it("should fail on null TokenId", () => {
        let payloadString = JSON.stringify({
            TokenId: null as any,
            JobId: "",
        } as Payload);
        let result = ParsePayloadFromJSONString(payloadString);
        equal(result.Error, "TokenId is a required parameter");
    });
});
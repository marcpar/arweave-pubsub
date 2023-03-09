import { equal, notEqual } from "assert";
import { ParsePayloadFromJSONString, Payload } from "../src/queue/payload.js";

describe("Payload Validation", () => {
    it("should be able to parse valid payload", () => {
        let payload = JSON.stringify({
            JobId: '1234567890',
            MediaURL: 'https://localhost/image',
            Metadata: {},
        } as Payload);

        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, null);
    });

    it("should fail on undefined JobId", () => {
        let payload = JSON.stringify({
            JobId: undefined as any,
            MediaURL: 'https://localhost/image',
            Metadata: {},
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on null JobId", () => {
        let payload = JSON.stringify({
            JobId: undefined as any,
            MediaURL: 'https://localhost/image',
            Metadata: {},
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "JobId is a required parameter");
    });

    it("should fail on undefined MediaURL", () => {
        let payload = JSON.stringify({
            JobId: "1231232",
            MediaURL: undefined as any,
            Metadata: {},
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "MediaURL is a required parameter");

    });

    it("should fail on null MediaURL", () => {
        let payload = JSON.stringify({
            JobId: "1231232",
            MediaURL: null as any,
            Metadata: {},
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "MediaURL is a required parameter");
    });

    it("should fail on invalid MediaURL", () => {
        let payload = JSON.stringify({
            JobId: "1231232",
            MediaURL: "",
            Metadata: {},
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "MediaURL should be a valid url: Invalid URL");
    });

    it("should fail on undefined Metadata", () => {
        let payload = JSON.stringify({
            JobId: "1231232",
            MediaURL: "",
            Metadata: undefined,
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "Metadata is a required parameter");
    });

    it("should fail on null Metadata", () => {
        let payload = JSON.stringify({
            JobId: "1231232",
            MediaURL: "",
            Metadata: null,
        } as Payload);
        let result = ParsePayloadFromJSONString(payload);
        equal(result.Error, "Metadata is a required parameter");
    });

});
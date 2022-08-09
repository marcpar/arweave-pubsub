import { equal } from "assert";
import { hello } from "../lib/util.js";


describe("Processor", () => {
    it("should be able to download media", () => {
        equal(true, true);
    });
    it("should say hello", () => {
        equal(hello(), "hello");
    })
});
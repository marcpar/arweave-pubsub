import { Sleep } from "./sleep.js";

async function withRetry<T>(closure: () => Promise<T>, retries: number = 1): Promise<T> {
    try {
        let result = await closure();
        return result;
    } catch (e) {
        if (retries < 1) {
            throw Error(`maximum retries exceeded with error: ${e}`);
        }
    }
    await Sleep(5000);
    return withRetry(closure, retries - 1);
}

export {
    withRetry
}
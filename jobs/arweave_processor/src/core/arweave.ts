import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet.js";
import { fileTypeFromBuffer } from "file-type";
import { Logger } from "../lib/logger.js";
import { Sleep } from "../lib/util.js";

let _minConfirmations: number;

function SetMinConfirmations(minConfirmations: number) {
    _minConfirmations = minConfirmations;
}

let _client: Arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

let _wallet: JWKInterface;

function SetArweaveWallet(wallet: JWKInterface) {
    _wallet = wallet;
}

async function UploadMediaToPermaweb(media: Buffer, jobID: string): Promise<string> {

    let tx = await _client.createTransaction({
        data: media
    }, _wallet);

    let filetype = await fileTypeFromBuffer(media);
    if (filetype) {
        tx.addTag("Content-Type", filetype.mime);
    }
    
    tx.addTag("App-Name", "NFTDesignWorks");
    if (jobID) tx.addTag("JobID", jobID);

    await _client.transactions.sign(tx, _wallet);

    let uploader = await _client.transactions.getUploader(tx);
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        Logger().debug(`Job: ${jobID}, Status; uploading ${uploader.pctComplete}%`)
    }

    return tx.id;
}

async function ConfirmUpload(txID: string, minConfirmations?: number): Promise<number> {
    if (minConfirmations === undefined || minConfirmations === null) {
        minConfirmations = _minConfirmations;
    }

    let currentConfirmations = 0;
    while (true) {
        let status = await _client.transactions.getStatus(txID);
        if (status.status < 200 || status.status > 299) {
            throw new Error(`Invalid transaction status code ${status.status} for tx ${txID}`);
        }

        if (status.confirmed) {
            if (currentConfirmations !== status.confirmed.number_of_confirmations) {
                currentConfirmations = status.confirmed.number_of_confirmations;
                Logger().info(`tx ${txID}: confirmed ${currentConfirmations} out of ${minConfirmations} confirmations`);
            }

            if (currentConfirmations >= minConfirmations) {
                Logger().info(`tx ${txID} has been confirmed with ${status.confirmed.number_of_confirmations} confirmations`);
                return currentConfirmations;
            }
        } else {
            Logger().debug(`TX: ${txID}, Status: ${status.status}`);
        }

        await Sleep(5000);
    }

}



export {
    SetArweaveWallet,
    UploadMediaToPermaweb,
    SetMinConfirmations,
    ConfirmUpload
}
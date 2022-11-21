import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet.js";
import { fileTypeFromBuffer } from "file-type";
import { Logger } from "../lib/logger.js";
import { Sleep } from "../lib/util.js";
import {
    createData,
    bundleAndSignData,
} from "arbundles";
import { ArweaveSigner } from "arbundles/src/signing/index.js";
import { logger } from "@azure/storage-queue";


type PathManifest = {
    manifest: 'arweave/paths',
    version: '0.1.0',
    index: {
        path: string
    },
    paths: Paths
}

type Paths = {
    [path: string]: {
        id: string
    }
}

type UploadResult = {
    BundleTxID: string,
    PathManifestTxID: string,
}

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

async function UploadMediaToPermaweb(media: Buffer, metadata: any, jobID: string): Promise<UploadResult> {
    let signer = new ArweaveSigner(_wallet);

    let mediaFileType = await fileTypeFromBuffer(media);
    if (!mediaFileType) {
        throw new Error(`Job ${jobID}, failed to get mime of media`);
    }

    let mediaData = createData(media, signer, {
        tags: [{
            name: 'Content-Type',
            value: mediaFileType.mime
        }]
    });
    await mediaData.sign(signer);

    let metadataData = createData(JSON.stringify(metadata), signer, {
        tags: [{
            name: 'Content-Type',
            value: 'application/json'
        }]
    });
    
    await metadataData.sign(signer);
    
    let mediaPath = `nft.${mediaFileType.ext}`

    let paths = {} as Paths;
    paths[mediaPath] = {
        id: mediaData.id
    };
    paths['metadata.json'] = {
        id: metadataData.id
    }
    let pathManifest = JSON.stringify({
        manifest: 'arweave/paths',
        version: '0.1.0',
        index: {
            path: mediaPath
        },
        paths: paths
    } as PathManifest);

    
    let pathManifestData = createData(pathManifest, signer, {
        tags: [{
            name: 'Content-Type',
            value: 'application/x.arweave-manifest+json'
        }]
    });
    await pathManifestData.sign(signer);
    
    Logger().debug(`path manifest ${pathManifestData.id}:\n${pathManifest}`)

    let bundle = await bundleAndSignData([mediaData, metadataData, pathManifestData], signer);

    let tx = await bundle.toTransaction({}, _client, _wallet);

    tx.addTag("App-Name", "NFTDesignWorks");
    if (jobID) tx.addTag("JobID", jobID);

    await _client.transactions.sign(tx, _wallet);

    let uploader = await _client.transactions.getUploader(tx);
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        Logger().debug(`Job: ${jobID}, Status; uploading ${uploader.pctComplete}%`)
    }
    
    return {
        BundleTxID: tx.id,
        PathManifestTxID: pathManifestData.id
    };
}

async function ConfirmUpload(txID: string, minConfirmations?: number): Promise<number> {
    if (minConfirmations === undefined || minConfirmations === null) {
        minConfirmations = _minConfirmations;
    }

    let currentConfirmations = 0;
    while (true) {
        let status = await _client.transactions.getStatus(txID);

        if (status.status === 429) {
            Logger().warn(`tx ${txID} Throttled by arweave api with status ${status.status}, sleeping for 6000ms`);
            await Sleep(6000);
            continue;
        }
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

        await Sleep(10000);
    }

}



export {
    SetArweaveWallet,
    UploadMediaToPermaweb,
    SetMinConfirmations,
    ConfirmUpload
}
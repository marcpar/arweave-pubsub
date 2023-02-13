import { JWKInterface } from "arweave/node/lib/wallet.js";
import { fileTypeFromBuffer } from "file-type";
import { Logger } from "../lib/logger.js";
import { Sleep } from "../lib/util.js";
import {
    createData,
    bundleAndSignData,
    DataItem,
} from "arbundles";
import { ArweaveSigner } from "arbundles/src/signing/index.js";
import Arweave from 'arweave';

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

type OpenSeaMetadata = {
    description?: string,
    external_url?: string,
    image?: string,
    name?: string,
    animation_url?: string,
    attributes?: {
        trait_type?: string,
        value?: any
    }[]
}

type UploadResult = {
    BundleTxID: string,
    JobIDPathManifestID: JobIDPathManifestMap
}

type JobIDPathManifestMap = {
    [jobID: string]: string
}

type UploadParams = {
    media: Buffer,
    thumbnail?: Buffer,
    metadata: any,
    jobID: string
}

type NFTDataItems = {
    media: DataItem,
    thumbnail?: DataItem,
    metadata: DataItem,
    pathManifest: DataItem,
    openSeaMetadata: DataItem
}

let _minConfirmations: number;

let _client: Arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

let _wallet: JWKInterface;

function SetMinConfirmations(minConfirmations: number) {
    _minConfirmations = minConfirmations;
}

function SetArweaveWallet(wallet: JWKInterface) {
    _wallet = wallet;
}

async function UploadMediaToPermaweb(uploadParams: UploadParams[]): Promise<UploadResult> {

    let signer = new ArweaveSigner(_wallet);

    let jobIDPathManifestMap: JobIDPathManifestMap = {};

    let dataItems: DataItem[] = [];
    for (const uploadParam of uploadParams) {
        let nftDataItems = await createNFTDataItem(uploadParam, signer);
        dataItems.push(nftDataItems.media, nftDataItems.metadata, nftDataItems.pathManifest, nftDataItems.openSeaMetadata);
        if (nftDataItems.thumbnail) dataItems.push(nftDataItems.thumbnail);
        jobIDPathManifestMap[uploadParam.jobID] = nftDataItems.pathManifest.id;
    }

    let bundle = await bundleAndSignData(dataItems, signer);

    let tx = await bundle.toTransaction({}, _client, _wallet);
    tx.addTag("App-Name", "NFTDesignWorks");
    await _client.transactions.sign(tx, _wallet);

    let uploader = await _client.transactions.getUploader(tx, bundle.getRaw());
    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        Logger().info(`TX: ${tx.id}, Status; uploading ${uploader.pctComplete}%`)
    }

    return {
        BundleTxID: tx.id,
        JobIDPathManifestID: jobIDPathManifestMap
    };
}

async function createNFTDataItem(params: UploadParams, signer: ArweaveSigner): Promise<NFTDataItems> {
    let mediaFileType = await fileTypeFromBuffer(params.media);
    if (!mediaFileType) {
        throw new Error(`Job ${params.jobID}, failed to get mime of media`);
    }

    let paths = {} as Paths;

    let mediaData = await createDataItemAndSign(params.media, signer, [{
        name: 'Content-Type',
        value: mediaFileType.mime
    }, {
        name: "JobID",
        value: params.jobID
    }]);
    let mediaPath = `nft.${mediaFileType.ext}`
    paths[mediaPath] = {
        id: mediaData.id
    };

    let thumbnailData: DataItem | undefined = undefined;
    if (params.thumbnail) {
        let thumbnailMediaType = await fileTypeFromBuffer(params.thumbnail);
        thumbnailData = await createDataItemAndSign(params.thumbnail, signer, [{
            name: 'Content-Type',
            value: thumbnailMediaType?.mime ?? 'image/jpg'
        }, {
            name: "JobID",
            value: params.jobID
        }]);
        paths[`thumbnail.${thumbnailMediaType?.ext ?? 'jpg'}`] = {
            id: thumbnailData.id
        };
    }

    let metadataData = await createDataItemAndSign(JSON.stringify(params.metadata), signer, [{
        name: 'Content-Type',
        value: 'application/json'
    }, {
        name: "JobID",
        value: params.jobID
    }]);

    paths['metadata.json'] = {
        id: metadataData.id
    }

    let openSeaMetadata = {};
    if (params.metadata.ValuePairs) {
        let attributes: any[] = [];
        let eventName = "";
        let recipientName = "";

        params.metadata.ValuePairs.forEach((valuePair: any) => {
            attributes.push({
                trait_type: valuePair.Key,
                value: valuePair.Value
            });
            switch ((valuePair.Key as string).toLowerCase()) {
                case 'event name':
                    eventName = valuePair.Value
                    break;
                case 'recipient name':
                    recipientName = valuePair.Value
                    break;
                default:
            }
        });

        openSeaMetadata = {
            name: `${recipientName} - ${eventName}`,
            animation_url: `ar://${mediaData.id}`,
            image: thumbnailData ? `ar://${thumbnailData.id}` : null,
            attributes: attributes,
            external_url: `ar://${metadataData.id}`,
            description: eventName
        } as OpenSeaMetadata
    }

    let openSeaDataItem = await createDataItemAndSign(JSON.stringify(openSeaMetadata), signer, [{
        name: 'Content-Type',
        value: 'application/json'
    }, {
        name: "JobID",
        value: params.jobID
    }]);

    paths['opensea.json'] = {
        id: openSeaDataItem.id
    }

    let pathManifest = JSON.stringify({
        manifest: 'arweave/paths',
        version: '0.1.0',
        index: {
            path: mediaPath
        },
        paths: paths
    } as PathManifest);

    let pathManifestData = await createDataItemAndSign(pathManifest, signer, [{
        name: 'Content-Type',
        value: 'application/x.arweave-manifest+json'
    }, {
        name: "JobID",
        value: params.jobID
    }]);

    Logger().debug(`path manifest ${pathManifestData.id}:\n${pathManifest}`)
    return {
        media: mediaData,
        thumbnail: thumbnailData,
        metadata: metadataData,
        pathManifest: pathManifestData,
        openSeaMetadata: openSeaDataItem
    };
}

async function createDataItemAndSign(data: string | Uint8Array, signer: ArweaveSigner, tags?: { name: string, value: string }[]): Promise<DataItem> {
    let dataItem = createData(data, signer, { tags: tags });
    await dataItem.sign(signer);
    return dataItem;
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
    UploadParams,
    SetArweaveWallet,
    UploadMediaToPermaweb,
    SetMinConfirmations,
    ConfirmUpload,
}
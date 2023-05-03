import {
    KeyPair
} from 'near-api-js';
import { ClaimDetails } from '../src/core/near.js';
import { Logger } from 'lib/dist/util/logger.js';

let claimURLString = 'http://localhost:8080//claim/nft.nftdw-001.testnet/438c0f6b-469e-4480-8ff0-51961e3b1f78?token=eyJORlRDb250cmFjdCI6Im5mdC5uZnRkdy0wMDEudGVzdG5ldCIsIlRva2VuSWQiOiI0MzhjMGY2Yi00NjllLTQ0ODAtOGZmMC01MTk2MWUzYjFmNzgiLCJQcml2YXRlS2V5IjoiZWQyNTUxOTpSRFJZOXRGTHc3ZmdUeU43ZUd4TlBGY1J4OVBVcHdRYTlEVTFNcExWWGU3TGNLRGlyTkp4ZFZuUUJIOGRHaGRUTHFqclVkZGpNZEhXWGtCQlhSYXlBbksiLCJWYXVsdENvbnRyYWN0IjoidmF1bHQubmZ0ZHctMDAxLnRlc3RuZXQifQ%3D%3D';
let claimURL = new URL(claimURLString);
let claimDetails = JSON.parse(Buffer.from(claimURL.searchParams.get('token') as string, 'base64').toString('utf-8')) as ClaimDetails;



let keypair = KeyPair.fromString(claimDetails.PrivateKey);

let payloadBuff = Buffer.from(JSON.stringify({
    token_id: claimDetails.TokenId,
    nft_account_id: claimDetails.NFTContract,
    timestamp_millis: (new Date()).getTime(),
}), 'utf-8');

let sign = keypair.sign(payloadBuff);

Logger().info(`${payloadBuff.toString('base64')}.${Buffer.from(sign.signature.buffer).toString('base64')}`);
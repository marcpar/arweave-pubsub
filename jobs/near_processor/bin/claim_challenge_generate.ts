import {
    KeyPair
} from 'near-api-js';
import { Logger } from '../src/lib/logger.js';


let keypair = KeyPair.fromString('ed25519:5QjGRapwbTQeVjownukB135CCvqy2f2fzvrFquh7D5iJfrQXiqA2VEGSNazknXB67etEC1eTMEXvkZmDpwWzY6EY');

let payload_buff = Buffer.from(JSON.stringify({
    token_id: "d19b671d-72e5-4805-9eb2-c3ada7adff66",
    nft_account_id: "nft.nftdw-001.testnet",
    timestamp_millis: (new Date()).getTime(),
}), 'utf-8');



let sign = keypair.sign(payload_buff);

Logger().info(`${payload_buff.toString('base64')}.${Buffer.from(sign.signature.buffer).toString('base64')}`);




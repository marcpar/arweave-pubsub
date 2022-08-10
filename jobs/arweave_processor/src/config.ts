import { JWKInterface } from 'arweave/node/lib/wallet.js';
import env from 'dotenv';


type Config = {
    AzureAccountName: string,
    AzureAccountKey: string,
    Topic: string,
    Wallet: JWKInterface,
    MinimumConfirmations: number,
    DefaultCallbackURL: string
}


let config: Config;
env.config();

function LoadConfig() {
    config = {
        AzureAccountName: process.env.AZURE_ACCOUNT_NAME as string,
        AzureAccountKey: process.env.AZURE_ACCOUNT_KEY as string,
        Topic: process.env.TOPIC as string,
        Wallet: JSON.parse(process.env.WALLET_JSON as string) as JWKInterface,
        MinimumConfirmations: process.env.MIN_CONFIRMATIONS ? parseInt(process.env.MIN_CONFIRMATIONS) : 20,
        DefaultCallbackURL: process.env.DEFAULT_CALLBACK_URL as string
    }
}

function GetConfig(): Config {
    if (!config) {
        throw new Error("Config is not yet loaded, call LoadConfig() first");
    }

    return config;
}


export {
    Config,
    LoadConfig,
    GetConfig
}
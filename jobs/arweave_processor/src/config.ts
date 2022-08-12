import { JWKInterface } from 'arweave/node/lib/wallet.js';
import env from 'dotenv';
import { Logger } from './lib/logger.js';


type Config = {
    AzureAccountName: string,
    AzureAccountKey: string,
    Topic: string,
    Wallet: JWKInterface,
    MinimumConfirmations: number,
    DefaultCallbackURL: string,
    MaxJobs: number,
}

let config: Config;
env.config();

function LoadConfig() {
    let wallet = {} as JWKInterface;
    if (!process.env.DEFAULT_CALLBACK_URL) {
        Logger().error("DEFAULT_CALLBACK_URL is a required environment variable")
        process.exit(1);
    }
    if (!process.env.TOPIC) {
        Logger().error("TOPIC is a required environment variable");
        process.exit(1);
    }
    if (!process.env.AZURE_ACCOUNT_NAME) {
        Logger().error("AZURE_ACCOUNT_NAME is a required environment variable");
        process.exit(1);
    }
    if (!process.env.AZURE_ACCOUNT_KEY) {
        Logger().error("AZURE_ACCOUNT_KEY is a required environment variable");
        process.exit(1);
    }
    try {
        wallet = JSON.parse(process.env.WALLET_JSON as string);
    } catch (e) {
        Logger().error(`Failed to load WALLET_JSON, make sure that it is a valid json string and a valid arweave wallet`);
        process.exit(1);
    }

    try {
        config = {
            AzureAccountName: process.env.AZURE_ACCOUNT_NAME,
            AzureAccountKey: process.env.AZURE_ACCOUNT_KEY,
            Topic: process.env.TOPIC,
            Wallet: wallet,
            MinimumConfirmations: process.env.MIN_CONFIRMATIONS ? parseInt(process.env.MIN_CONFIRMATIONS) : 15,
            DefaultCallbackURL: process.env.DEFAULT_CALLBACK_URL,
            MaxJobs: process.env.MAX_JOBS ? parseInt(process.env.MAX_JOBS) : 0
        }
    } catch (e) {
        let err = e as Error;
        Logger().error(`Failed to load configuration, check if .env setting is correct: ${err.message}\n${err.stack ?? ''}`);
        process.exit(1);
    }

    Logger().debug(`loaded configuration:\n${JSON.stringify(config)}`);
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
import env from 'dotenv';
import { Logger } from './lib/logger.js';
import {
    
} from 'near-api-js'


type Config = {
    AzureAccountName: string,
    AzureAccountKey: string,
    Topic: string,
    NearAccountName: string,
    NearAccountPrivateKey: string,
    NearMinterContractName: string,
    NearEnv: "testnet" | "mainnet",
    DefaultCallbackURL: string,
    MaxJobs: number,
}

let config: Config;
env.config();

function LoadConfig() {
    
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
    if (!process.env.NEAR_ACCOUNT_NAME) {
        Logger().error("NEAR_ACCOUNT_NAME is a required environment variable");
        process.exit(1);
    }
    if (!process.env.NEAR_ACCOUNT_PRIVATE_KEY) {
        Logger().error("NEAR_ACCOUNT_PRIVATE_KEY is a required environment variable");
        process.exit(1);
    }
    if (process.env.NEAR_ENV !== "mainnet" && process.env.NEAR_ENV !== "testnet") {
        Logger().error("NEAR_ENV should be mainnet or testnet");
        process.exit(1);
    }
    
    try {
        config = {
            AzureAccountName: process.env.AZURE_ACCOUNT_NAME,
            AzureAccountKey: process.env.AZURE_ACCOUNT_KEY,
            Topic: process.env.TOPIC,
            NearAccountName: process.env.NEAR_ACCOUNT_NAME,
            NearAccountPrivateKey: process.env.NEAR_ACCOUNT_PRIVATE_KEY,
            NearMinterContractName: process.env.NEAR_ACCOUNT_CONTRACT_NAME ?? process.env.NEAR_ACCOUNT_NAME,
            NearEnv: process.env.NEAR_ENV,
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
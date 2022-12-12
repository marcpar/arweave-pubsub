const NETWORK: 'testnet' | 'mainnet' = process.env.REACT_APP_NEAR_NETWORK ?? 'testnet' as any;
const VAULT_CONTRACT_ADDRESS = process.env.REACT_APP_VAULT_CONTRACT ?? 'vault.world-triathlon.testnet';

export {
    NETWORK,
    VAULT_CONTRACT_ADDRESS
}
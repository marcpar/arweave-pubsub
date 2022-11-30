import { GetConfig, GetNear } from './connection';

(async () => {
    const nft = 'nft.triathlon.near';
    const vault = 'vault.triathlon.near';

    let near = await GetNear(GetConfig('mainnet'));
    let account = await near.account('');

    let nftTotalSupply = await account.viewFunctionV2({
        contractId: nft,
        methodName: 'nft_total_supply',
        args: {}
    }) as number;

    let nftOnVault = await account.viewFunctionV2({
        contractId: nft,
        methodName: 'nft_supply_for_owner',
        args: {
            account_id: vault
        }
    }) as number;

    let nftOnContract = await account.viewFunctionV2({
        contractId: nft,
        methodName: 'nft_supply_for_owner',
        args: {
            account_id: nft
        }
    }) as number;

    console.log(`Total Supply: ${nftTotalSupply}`);
    console.log(`Owned by nft.triathlon.near(not distributed): ${nftOnContract}`);
    console.log(`Owned by vault.triathlon.near(for claiming): ${nftOnVault}`);
    console.log(`Owned by other accounts(delivered): ${nftTotalSupply - nftOnContract - nftOnVault}`)
})();
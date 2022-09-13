import { useParams, useSearchParams } from 'react-router-dom';
import { GetWallet, useIsLoggedInHook } from '../Providers/Wallet';
import style from "./ClaimNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { useEffect, useState } from "react";
import { ClaimChallenge, ClaimDetails, GetVaultContract, GetVaultContractAnonAsync } from '../Libraries/Near/vault';
import Media from '../Components/Media/Media';
import * as nearAPI from "near-api-js";

function parseToken(token: string): ClaimDetails {
    let claimDetails!: ClaimDetails
    try {
        claimDetails = JSON.parse(Buffer.from(token, 'base64').toString("utf-8")) as ClaimDetails;
    } catch (e) {
        throw new Error(`Invalid token: ${e}`);
    }

    if (claimDetails.PrivateKey === null || claimDetails.PrivateKey === undefined) {
        throw new Error("invalid token");
    }
    return claimDetails;
}

function generateClaimChallenge(nft_account_id: string, token_id: string, claimDetails: ClaimDetails): string {
    if (claimDetails.NFTContract !== nft_account_id || claimDetails.TokenId !== token_id) {
        throw new Error("nft mismatch");
    }
    let key = nearAPI.utils.KeyPairEd25519.fromString(claimDetails.PrivateKey);
    let challenge = {
        nft_account_id: nft_account_id,
        token_id: token_id,
        timestamp_millis: new Date().getTime()
    } as ClaimChallenge;
    let challengeBuff = Buffer.from(JSON.stringify(challenge), 'utf-8');
    let sig = key.sign(challengeBuff);

    return `${challengeBuff.toString('base64')}.${Buffer.from(sig.signature).toString('base64')}`
}

async function claimHandler(claim_token: string, callback: string) {
    let vaultContract = GetVaultContract(GetWallet().account());
    await vaultContract.claim({
        callbackUrl: callback,
        args: {
            claim_token: claim_token
        }, gas: nearAPI.DEFAULT_FUNCTION_CALL_GAS, deposit: "1"
    })
}

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let [searchParams] = useSearchParams();
    let token = searchParams.get('token') ?? '';
    let isLoggedIn = useIsLoggedInHook();
    const [nftToken, setnftToken] = useState<NFTToken | undefined | null>(undefined);
    const [nftMeta, setnftMeta] = useState<NFTContractMetadata | undefined | null>(undefined);
    const [isClaimable, setIsClaimable] = useState<boolean>(false);

    function claim() {
        let claimToken = generateClaimChallenge(nft as string, token_id as string, parseToken(token));
        claimHandler(claimToken, `https://wallet.${process.env.REACT_APP_NEAR_NETWORK ?? "testnet"}.near.org/nft-detail/${nft}/${token_id}`);
    }

    useEffect(() => {
        if (nftMeta === undefined || nftToken === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
                console.log(contract.get_claimable)
                let claimable = await contract.get_claimable({
                    nft_account: nft as string,
                    token_id: token_id as string
                });
                if (claimable === null) {
                    setnftMeta(null);
                    setnftToken(null);
                    return;
                }

                let nftContract = await GetNFTContract(claimable.nft_account_id)
                setnftMeta(await nftContract.nft_metadata());
                setnftToken(await nftContract.nft_token({
                    token_id: claimable.token_id
                }));

                let vaultAnon = await GetVaultContractAnonAsync();

                let claimToken = generateClaimChallenge(nft as string, token_id as string, parseToken(token));
                claimable = await vaultAnon.is_claimable({
                    claim_token: claimToken
                });
                if (claimable !== null) {
                    setIsClaimable(true);
                }
            })
        }
    });

    if (nftMeta === undefined || nftToken === undefined) {
        return (
            <div>Loading</div>
        );
    }

    if (nftMeta === null || nftToken === null) {
        return (
            <div>Claimable does not exist</div>
        )
    }

    return (
        <div className={style.card}>
            <div className={style.card_header}>
                <span>{nftToken.metadata.title}</span>
            </div>
            <div className={style.card_body}>
                <Media src={`${nftMeta.base_uri}/${nftToken.metadata.media}`} />
            </div>
            <div className={style.card_footer}>
                <button onClick={claim} disabled={!(isLoggedIn && isClaimable)}>Claim</button>
            </div>
        </div>
    );
}
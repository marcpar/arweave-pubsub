import { useParams, useSearchParams } from 'react-router-dom';
import { GetWallet, useIsLoggedInHook } from '../Providers/Wallet';
import style from "./ClaimNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { useEffect, useState } from "react";
import { ClaimChallenge, ClaimDetails, GetVaultContract, GetVaultContractAnonAsync } from '../Libraries/Near/vault';
import Media from '../Components/Media/Media';
import * as nearAPI from "near-api-js";
import Tilt from "react-parallax-tilt";
import { GridLoader } from "react-spinners";

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

type NFTDetails = {
    nftMeta: NFTContractMetadata | null ,
    nftToken: NFTToken | null 
}

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let [searchParams] = useSearchParams();
    let token = searchParams.get('token') ?? '';
    let isLoggedIn = useIsLoggedInHook();
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null >(undefined);
    const [isClaimable, setIsClaimable] = useState<boolean>(false);

    function claim() {
        let claimToken = generateClaimChallenge(nft as string, token_id as string, parseToken(token));
        claimHandler(claimToken, `https://wallet.${process.env.REACT_APP_NEAR_NETWORK ?? "testnet"}.near.org/nft-detail/${nft}/${token_id}`);
    }

    useEffect(() => {
        if (nftDetails === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
                console.log(contract.get_claimable)
                let claimable = await contract.get_claimable({
                    nft_account: nft as string,
                    token_id: token_id as string
                });
                if (claimable === null) {
                    setnftDetails(null);
                    return;
                }

                let nftContract = await GetNFTContract(claimable.nft_account_id)

                setnftDetails({
                    nftMeta: await nftContract.nft_metadata(),
                    nftToken: await nftContract.nft_token({
                        token_id: claimable.token_id
                    })
                });

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
    
    if (nftDetails === undefined) {
        return (
            <div className={style.loader_container}>
                <GridLoader color={"rgb(0, 98, 190)"}/>
            </div>
        );
    }

    if (nftDetails === null || nftDetails.nftMeta === null || nftDetails.nftToken === null) {
        return (
            <div>Claimable does not exist</div>
        )
    }

    

    return (
        <div className={style.main_container}>
            <Tilt tiltReverse={true} tiltMaxAngleX={5} tiltMaxAngleY={5} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_header}>
                        <div className={style.nft_name}>{nftDetails.nftMeta.name}</div>
                        <div className={style.nft_title}>{nftDetails.nftToken.metadata.title}</div>
                    </div>
                    <div className={style.card_body}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} />
                    </div>
                    <div className={style.card_footer}>
                        <span>{nftDetails.nftToken.token_id}</span>
                    </div>
                </div>
            </Tilt>
            <button className={style.button} onClick={claim} disabled={!(isLoggedIn && isClaimable)}>Claim</button>
        </div>
    );
}
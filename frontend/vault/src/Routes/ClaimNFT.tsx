import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

function generateClaimChallenge(owner_id: string, nft_account_id: string, token_id: string, claimDetails: ClaimDetails): string {
    if (claimDetails.NFTContract !== nft_account_id || claimDetails.TokenId !== token_id) {
        throw new Error("nft mismatch");
    }
    let key = nearAPI.utils.KeyPairEd25519.fromString(claimDetails.PrivateKey);
    let challenge = {
        nft_account_id: nft_account_id,
        token_id: token_id,
        timestamp_millis: new Date().getTime(),
        owner_id: owner_id,
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
        }, gas: nearAPI.DEFAULT_FUNCTION_CALL_GAS, amount: "1"
    })
}

function createWalletHandler() {
    let network = process.env.REACT_APP_NEAR_NETWORK ?? "testnet";
    switch (network) {
        case "testnet":
            window.location.href = 'https://wallet.testnet.near.org/create';
            break;
        case "mainnet":
            window.location.href = 'https://wallet.near.org/create'
            break;
        default:
            throw new Error(`unkown network ${network}`)
    }
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
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    function claim() {
        let claimToken = generateClaimChallenge(GetWallet().account().accountId, nft as string, token_id as string, parseToken(token));
        claimHandler(claimToken, `https://wallet.${process.env.REACT_APP_NEAR_NETWORK ?? "testnet"}.near.org/nft-detail/${nft}/${token_id}`);
    }

    useEffect(() => {
        if (nftDetails === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
                console.log(`${nft}:${token_id}`);
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
                
                let claimDetails = parseToken(token);
                let claimKeyPair = nearAPI.utils.KeyPair.fromString(claimDetails.PrivateKey);

                if (claimable !== null && claimable.public_key === claimKeyPair.getPublicKey().toString()) {
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
        navigate('/not-found');
        return (
            <div>Claimable does not exist</div>
        )
    }
    let fullname: string | undefined = ""
    try {
        let extra = JSON.parse(nftDetails.nftToken.metadata?.extra as string);
        let valuePairs = extra.ValuePairs as Array<{Key: string, Value: string}>;
        let recipientName = valuePairs.find((el) => {
            return el.Key === "RecipientName";
        });
        fullname = recipientName?.Value as string;
    } catch(_) {
        fullname = "Participant";
    }

    return (
        <div className={style.main_container}>
            <div className={style.greetings}>
                <h3>{fullname}</h3>
                <p>Congratulations for competing in the 2022 World Triathlon Age-Group Championships Abu Dhabi.</p>
                <p>Your Competior Capsule is ready to be claimed.</p>
            </div>
            <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_media}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} isLoadingSetter={setIsMediaLoading} />
                    </div>
                    <div className={style.button_container}>
                        <button className={isMediaLoading ? style.hidden : style.button} onClick={claim} disabled={!isClaimable}>Claim</button>
                    </div>
                </div>
            </Tilt>
            
        </div>
    );
}
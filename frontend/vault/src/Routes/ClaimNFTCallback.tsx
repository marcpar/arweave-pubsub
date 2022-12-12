import { useSearchParams } from "react-router-dom";
import { NETWORK } from "../Libraries/Near/constants";
import { ClaimDetails } from "../Libraries/Near/vault";
import { ClaimWithLoggedInAccountCallback } from "./ClaimNFTHandler";
import { DotLoader, GridLoader } from 'react-spinners';
import style from "./ClaimNFT.module.css"


export default function ClaimNFTCallback() {
    let [searchParams, _] = useSearchParams();
    let claimDetailsId = searchParams.get('claimDetailsId') as string;
    let claimDetails = JSON.parse(localStorage.getItem(claimDetailsId) as string) as ClaimDetails;
    
    ClaimWithLoggedInAccountCallback(claimDetails).then(() => {
        localStorage.removeItem(claimDetailsId);
        window.location.href = `https://${NETWORK === 'mainnet' ? 'app' : 'testnet'}.mynearwallet.com/nft-detail/${claimDetails.NFTContract}/${claimDetails.TokenId}`
    });
    return (
        <div className={style.loader_container}>
            <GridLoader color={"rgb(0, 98, 190)"}/>
        </div>
    )
    
}
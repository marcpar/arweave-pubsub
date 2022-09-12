import { useParams, useSearchParams } from 'react-router-dom';
import { useIsLoggedInHook } from '../Providers/Wallet';
import style from "./ClaimNFT.module.css";
import { GetNFTContract, NFTToken } from "../Libraries/Near/nft";
import { useState } from "react";

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let [searchParams, _] = useSearchParams();
    let token = searchParams.get('token') ?? '';
    let isLoggedIn = useIsLoggedInHook();
    const [ nftToken, setnftToken ] = useState<NFTToken | null>(null);
    
    if (!nftToken) {
        GetNFTContract(nft as string).then(async(contract) => {
            setnftToken(await contract.nft_token({
                token_id: token_id as string
            }));
        });

        return (
            <div>Loading</div>
        );
    }

    return (
        <div className={style.card}>
            <div className={style.card_header}>
                <span>{nftToken.metadata.title}</span>
            </div>
            <div className={style.card_body}>
                <img src={`https://arweave.net/${nftToken.metadata.media}/`}/>
            </div>
            <div className={style.card_footer}>
                <button disabled={!isLoggedIn}>Claim</button>
            </div>
        </div>
    );
}
import { useParams } from 'react-router-dom';
import style from "./ViewNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { useEffect, useState } from "react";
import Media from '../Components/Media/Media';
import Tilt from "react-parallax-tilt";
import { GridLoader } from "react-spinners";
import "react-json-pretty/themes/adventure_time.css";
import { useNavigate } from "react-router-dom";


type NFTDetails = {
    nftMeta: NFTContractMetadata | null ,
    nftToken: NFTToken | null 
}

export default function ViewNFT() {
    const { nft, token_id } = useParams();
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null >(undefined);
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (nftDetails === undefined) {
            GetNFTContract(nft as string).then(async (nftContract) => {
                setnftDetails({
                    nftMeta: await nftContract.nft_metadata(),
                    nftToken: await nftContract.nft_token({
                        token_id: token_id as string
                    })
                });
            }).catch(() => {
                setnftDetails(null);
            });
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
        navigate('/notfound');
        return(<div>not found</div>);
    }

    let fullname: string | undefined = ""
    try {
        let extra = JSON.parse(nftDetails.nftToken.metadata?.extra as string);
        let valuePairs = extra.ValuePairs as Array<{ Key: string, Value: string }>;
        let recipientName = valuePairs.find((el) => {
            return el.Key === "RecipientName" || el.Key === "Recipient Name";
        });
        fullname = recipientName?.Value as string;
    } catch (_) {
        fullname = "Participant";
    }

    return (
        <div className={style.main_container}>
            <div className={style.greetings}>
                <p className={style.full_name}>{fullname}</p>
                <p>Congratulations for competing in the 2022 World Triathlon Age-Group Championships Abu Dhabi.</p>
                <p>Your Race Capsule is ready to be claimed.</p>
            </div>
            <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_media}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} isLoadingSetter={setIsMediaLoading} />
                    </div>
                    <div className={style.button_container}>
                        <button className={ isMediaLoading ? style.hidden : style.button} type="button">Download</button>
                    </div>
                </div>
            </Tilt>
            <div className={ isMediaLoading ? style.hidden : style.link_container}>
                <span>Link: </span>
                <span><a href={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`}>{nftDetails.nftMeta.base_uri}/{nftDetails.nftToken.metadata.media}</a></span>
                <span className={style.copy_icon}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"/></svg>
                </span>
            </div>
        </div>
    );
}
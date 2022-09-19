import { useParams } from 'react-router-dom';
import style from "./ViewNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { useEffect, useState } from "react";
import Media from '../Components/Media/Media';
import Tilt from "react-parallax-tilt";
import { GridLoader } from "react-spinners";
import { JSONTree } from "react-json-tree";
import JSONPretty from "react-json-pretty";
import {Collapse} from "react-collapse";
import "react-json-pretty/themes/adventure_time.css";


type NFTDetails = {
    nftMeta: NFTContractMetadata | null ,
    nftToken: NFTToken | null 
}

export default function ViewNFT() {
    const { nft, token_id } = useParams();

    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null >(undefined);
    const [isMetaCollapsed, setIsMetaCollapsed] = useState<boolean>(false);

    useEffect(() => {
        if (nftDetails === undefined) {
            GetNFTContract(nft as string).then(async (nftContract) => {
                setnftDetails({
                    nftMeta: await nftContract.nft_metadata(),
                    nftToken: await nftContract.nft_token({
                        token_id: token_id as string
                    })
                });
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
        return (
            <div>Claimable does not exist</div>
        )
    }

    return (
        <div className={style.main_container}>
            <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_header}>
                        <div className={style.card_title}>{nftDetails.nftMeta.name}</div>
                        <div className={style.card_subtitle}>{nftDetails.nftToken.metadata.title}</div>
                    </div>
                    <div className={style.card_body}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} />
                    </div>
                    <div className={style.card_footer}>
                        <span>{nftDetails.nftToken.token_id}</span>
                    </div>
                </div>
            </Tilt>
            <div className={style.card} onClick={() => {setIsMetaCollapsed(!isMetaCollapsed)}}>
                <div className={style.card_header}>
                    <div className={style.card_title}>Owner</div>
                    <div className={style.card_subtitle}>{nftDetails.nftToken.owner_id}</div>
                </div>
                <Collapse isOpened={isMetaCollapsed}>
                    <div className={style.card_body}>
                        <JSONPretty data={nftDetails.nftToken.metadata.extra} className={style.metadata_container}/>
                    </div>
                </Collapse>
                
            </div>
        </div>
    );
}
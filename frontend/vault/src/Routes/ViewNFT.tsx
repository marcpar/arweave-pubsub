import { useParams } from 'react-router-dom';
import style from "./ViewNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { MouseEvent, useEffect, useState } from "react";
import Media from '../Components/Media/Media';
import Tilt from "react-parallax-tilt";
import { GridLoader } from "react-spinners";
import "react-json-pretty/themes/adventure_time.css";
import { useNavigate } from "react-router-dom";


type NFTDetails = {
    nftMeta: NFTContractMetadata | null,
    nftToken: NFTToken | null
}

export default function ViewNFT() {
    const { nft, token_id } = useParams();
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null>(undefined);
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

    function onClickCopy() {
        navigator.clipboard.writeText(`${nftDetails?.nftMeta?.base_uri}/${nftDetails?.nftToken?.metadata.media}`).then(() => {
            alert('copied to clipboard');
        });
    }

    function onClickDownload(e: MouseEvent<HTMLButtonElement>) {
        let anchor = document.createElement<"a">("a");
        let link = `${nftDetails?.nftMeta?.base_uri}/${nftDetails?.nftToken?.metadata.media}`;
        let button = e.currentTarget;
        button.disabled = true;
        fetch(link).then(async data => {
            anchor.href = URL.createObjectURL(await data.blob());;
            anchor.download = link.split('/').pop() ?? "nft";
            anchor.click();
        }).finally(() => {
            button.disabled = false;
        });
    }

    function redact(str: string, len: number): string {
        if (str.length / 2 < len) {
            return str;
        }
        return `${str.substring(0, len)}...${str.substring(str.length - len - 1)}`;
    }

    if (nftDetails === undefined) {
        return (
            <div className={style.loader_container}>
                <GridLoader color={"rgb(0, 98, 190)"} />
            </div>
        );
    }

    if (nftDetails === null || nftDetails.nftMeta === null || nftDetails.nftToken === null) {
        navigate('/notfound');
        return (<div>not found</div>);
    }

    let fullName: string | undefined = "";
    let eventName: string | undefined = "";
    let groupName: string | undefined = "";
    let eventCountry: string | undefined = "";
    try {
        let extra = JSON.parse(nftDetails.nftToken.metadata?.extra as string);
        let valuePairs = extra.ValuePairs as Array<{ Key: string, Value: string }>;
        valuePairs.forEach((el) => {
            let key = el.Key.toLowerCase();
            if (key === "recipient name" || key === "recipientname") {
                fullName = el.Value;
            } else if (key === "event name" || key === "eventname") {
                eventName = el.Value;
            } else if (key === "group name" || key === "groupname") {
                groupName = el.Value
            } else if (key === "event country" || key === "eventcountry")  {
                eventCountry = el.Value
            }
        });
    } catch (_) {
        fullName = "Participant";
        eventName = "World Triathlon";
    }

    return (
        <div className={style.main_container}>
            <div className={style.greetings}>
                <p className={style.full_name}>{fullName}</p>
                <p>Congratulations for competing in the {eventName} {groupName} {eventCountry}.</p>
                <p>Your Race Capsule is ready to be claimed.</p>
            </div>
            <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_media}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} isLoadingSetter={setIsMediaLoading} />
                    </div>
                    <div className={style.button_container}>
                        <button className={isMediaLoading ? style.hidden : style.button} type="button" onClick={onClickDownload}>Download</button>
                    </div>
                </div>
            </Tilt>
            <div className={isMediaLoading ? style.hidden : style.link_container}>
                <span>Link: </span>
                <span><a href={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`}>{redact(`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`, 25)}</a></span>
                <span className={style.copy_icon} onClick={onClickCopy}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"/></svg>
                </span>
            </div>
        </div>
    );
}
import styles from "./Media.module.css";
import { CircleLoader, BounceLoader } from "react-spinners";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { detect } from "detect-browser";

type MediaProps = {
    src: string
    isLoadingSetter?: Dispatch<SetStateAction<boolean>>
}


async function getMediaSafari(src: string): Promise<string> {
    let result = await fetch(`${src}`, {
        redirect: 'follow'
    });
    let blob = await result.arrayBuffer();
    let buffer = Buffer.from(blob);
    let b64 = buffer.toString('base64');
    let contentType = result.headers.get('Content-Type');
    return `data:${contentType ?? ""};base64,${b64}`
    
}

export default function Media(props: MediaProps) {
    let browser = detect();
    let ext = props.src.split(".").pop();
    let [isLoading, setIsLoading] = useState<boolean>(true);
    let [mediaSrc, setMediaSrc] = useState<string>('');

    function onLoadHandler() {
        setIsLoading(false);
        if (props.isLoadingSetter !== undefined && props.isLoadingSetter !== null) {
            props.isLoadingSetter(false);
        }
    }

    useEffect(() => {
        if (mediaSrc !== '') {
            return;
        }
        if (browser && (browser.name === 'safari' || browser.name === 'crios' || browser.name === 'ios' || browser.name === 'ios-webview')) {
            getMediaSafari(props.src).then((src) => {
                setIsLoading(false);
                setMediaSrc(src);
            });
        } else {
            setMediaSrc(props.src);
        }
    }, [mediaSrc, browser, props.src]);
    
    
    switch (ext) {
        case "mp4" || "webp":
            return (
                <div className={styles.media_container}>
                    <video src={mediaSrc} autoPlay muted playsInline={true} controls={false} loop className={isLoading ? styles.hidden : styles.media} onPlay={() => {onLoadHandler()}}/>
                    <BounceLoader className={styles.loader} loading={isLoading} color={"rgb(0, 98, 190)"} />
                </div>
            );
        case undefined:
            return (
                <CircleLoader />
            );
        default:
            return (
                <div className={styles.media_container}>
                    <img src={mediaSrc} className={isLoading ? styles.hidden : styles.media} onLoad={() => {onLoadHandler()}} alt={"nft"} />
                    <BounceLoader className={styles.loader} loading={isLoading} color={"rgb(0, 98, 190)"} />
                </div>
            );
    }

}
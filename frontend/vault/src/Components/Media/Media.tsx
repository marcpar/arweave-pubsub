import styles from "./Media.module.css";
import { CircleLoader, BounceLoader } from "react-spinners";
import { useState } from "react";

type MediaProps = {
    src: string
}

export default function Media(props: MediaProps) {
    let ext = props.src.split(".").pop();
    let [isLoading, setIsLoading] = useState<boolean>(true);

    function onLoadHandler() {
        console.log("onload");
        setIsLoading(false);
    }

    switch (ext) {
        case "mp4" || "webp":
            return (
                <div className={styles.media_container}>
                    <video src={props.src} autoPlay muted controls={false} loop className={isLoading ? styles.hidden : styles.media} onPlay={() => {onLoadHandler()}}/>
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
                    <img src={props.src} className={isLoading ? styles.hidden : styles.media} onLoad={() => {onLoadHandler()}} alt={"nft"} />
                    <BounceLoader className={styles.loader} loading={isLoading} color={"rgb(0, 98, 190)"} />
                </div>

            );
    }

}
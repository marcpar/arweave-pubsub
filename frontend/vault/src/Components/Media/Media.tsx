import styles from "./Media.module.css";

type MediaProps = {
    src: string
}

export default function Media(props: MediaProps) {
    let ext = props.src.split(".").pop();
    switch (ext) {
        case "jpg" || "png" || "jpeg" || "gif":
            return (
                <img src={props.src} className={styles.img} alt={"nft"}/>
            );
        case "mp4" || "webp":
            return (
                <video src={props.src} autoPlay={true}  controls={true} loop={true} className={styles.video}/>
            );
        case undefined:
            return (
                <span>Loading</span>
            );
        default:
            return (
                <span>Error: failed to load media {props.src}</span>
            );
    }

}
import { PropsWithChildren } from "react";
import styles from "./TopBar.module.css"


export default function TopBar(props: PropsWithChildren) {
    return (
        <div className={styles.top_bar}>
            {props.children}
        </div>
    );
}
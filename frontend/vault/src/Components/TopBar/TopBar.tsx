import styles from "./TopBar.module.css"
import { ReactNode, PropsWithChildren } from "react";

type TopbarProps = {
    left?: ReactNode,
    right?: ReactNode
}
export default function TopBar(props: TopbarProps) {
    return (
        <div className={styles.top_bar}>
            <div className={styles.left}>{props.left}</div>
            <div className={styles.right}>{props.right}</div>
        </div>
    );
}
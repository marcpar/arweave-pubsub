import { Outlet } from "react-router-dom";
import styles from "./Vault.module.css";
import { PropsWithChildren } from "react";

type VaultLayoutProps = {
    title: string
}

export default function VaultLayout(props: PropsWithChildren<VaultLayoutProps>) {

    return (
        <div>
            <div className={styles.top_bar}>
            </div>
            <div className={styles.content}>
                <Outlet />
            </div>
        </div>
        
    );
}
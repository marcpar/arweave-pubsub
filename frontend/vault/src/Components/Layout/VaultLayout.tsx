import { Outlet } from "react-router-dom";
import styles from "./Vault.module.css";

import { PropsWithChildren } from "react";
import HeaderLogo from "../../Assets/WT-CC-Logos.png";

type VaultLayoutProps = {
    title: string
}

export default function VaultLayout(props: PropsWithChildren<VaultLayoutProps>) {

    return (
        <div>
            <div className={styles.top_bar}>
                <img src={HeaderLogo} alt=""/>
            </div>
            <div className={styles.content}>
                <Outlet />
            </div>
        </div>
        
    );
}
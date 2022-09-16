import { Outlet } from "react-router-dom";
import { GetConfig, GetConnection } from "../../Libraries/Near/connection";
import TopBar from "../TopBar/TopBar";
import styles from "./Vault.module.css";
import * as nearAPI from 'near-api-js';
import { WalletConnection } from "near-api-js";

import { Component, PropsWithChildren, ReactNode } from "react";
import AppBadge from "../AppBadge/AppBadge";
import UserWidget from "../UserWidget/UserWidget";

type VaultLayoutProps = {
    title: string
}

export default function VaultLayout(props: PropsWithChildren<VaultLayoutProps>) {

    return (
        <div>
            <div className={styles.top_bar}>
                <TopBar left={<AppBadge name="NFT Vault" />} right={<UserWidget/>} />
            </div>
            <div className={styles.content}>
                <Outlet />
            </div>
        </div>
        
    );
}
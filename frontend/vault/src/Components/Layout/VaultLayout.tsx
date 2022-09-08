import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { GetConfig, GetConnection } from "../../Libraries/Near/connection";
import TopBar from "../TopBar/TopBar";
import styles from "./Vault.module.css";
import * as nearAPI from 'near-api-js';
import { WalletConnection } from "near-api-js";

type VaultLayoutProps = {
    title: string
}

export default function VaultLayout(props: PropsWithChildren<VaultLayoutProps>) {
    let _ = styles.div;
    GetConnection(GetConfig("testnet")).then(async (conn) => {
        console.log(conn);
        let wallet = new WalletConnection(conn, '');
        if (!wallet.isSignedIn()) {
            await wallet.requestSignIn({});
            return;
        }
        alert(wallet.getAccountId());
    });

    
    return (
        <div>
            <div>
                <TopBar>
                    <div>

                    </div>
                    <div>
                        {}
                    </div>

                </TopBar>
            </div>
            <div>
                <Outlet/>
            </div>
            {props.children}
        </div>
    );
}
import { PropsWithChildren } from "react";
import { Outlet } from "react-router-dom";
import { GetConfig, GetConnection } from "../../Libraries/Near/connection";
import TopBar from "../TopBar/TopBar";
import styles from "./Vault.module.css";

type VaultLayoutProps = {
    title: string
}

export default function VaultLayout(props: PropsWithChildren<VaultLayoutProps>) {
    let _ = styles.div;
    GetConnection(GetConfig("testnet")).then(conn => {
        console.log(conn);
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
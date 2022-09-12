import styles from "./UserWidget.module.css"
import { HiOutlineLogout, HiUser } from "react-icons/hi"
import { useIsLoggedInHook, Login, Logout, GetWallet } from "../../Providers/Wallet";
import { useState } from "react";



function loginHandler() {
    Login();
}

async function logOutHandler() {
    Logout();
}

export default function UserWidget() {
    let IsLoggedIn = useIsLoggedInHook();

    if (IsLoggedIn) {
        return (
            <div className={styles.user_name}>
                <div>
                    <span className={styles.icon}><HiUser/></span>
                    <span className={styles.name}>{GetWallet().account().accountId}</span>
                </div>
                <button onClick={logOutHandler}><HiOutlineLogout/></button>
            </div>
        );
    }

    return (
        <div className={styles.login_button}>
            <button onClick={loginHandler}>Login</button>
        </div>
    );
}


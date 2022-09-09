import styles from "./UserWidget.module.css"
import { useState } from "react";
import { HiOutlineLogout, HiUser } from "react-icons/hi"



export default function UserWidget() {
    const [IsLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [AccountId, setAccountId] = useState<string>("")    
    
    function loginHandler() {
        setIsLoggedIn(true);
    }
    
    function logOutHandler() {
        setIsLoggedIn(false);
    }

    if (IsLoggedIn) {
        return (
            <div className={styles.user_name}>
                
                <div>
                    <span className={styles.icon}><HiUser/></span>
                    <span className={styles.name}>UserLoggedIn</span>
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


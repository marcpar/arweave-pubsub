import { createRef } from 'react';
import styles from './CreateAccount.module.css';

export default function CreateAccount(props: {
    onValidAccountId: (account_id: string) => void,
    onStartOver: () => void
}) {
    let accountIdInputRef = createRef<HTMLInputElement>();

    return (
        <div className={styles.main}>
            <h1>Create Account</h1>
            <p>After the account creation, the claimable nft will automatically transfered to your newly created account.</p>
            <div className={styles.account_name}>
                <span>Account Name</span>
                <div className={styles.input_container}>
                    <input ref={accountIdInputRef} type="text" />
                </div>
            </div>
            <div className={styles.button_group}>
                <button type="button" disabled={true} onClick={() => {
                    props.onValidAccountId(accountIdInputRef.current?.value ?? '')
                }}>Create and Claim NFT</button>
            </div>
            <div className={styles.button_group}>
                <button type="button" onClick={props.onStartOver}>Start Over</button>
            </div>
        </div>
    )
}
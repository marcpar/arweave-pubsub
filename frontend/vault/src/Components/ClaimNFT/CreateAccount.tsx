import { ChangeEvent, ClipboardEvent, createRef, KeyboardEvent, useState } from 'react';
import { ACCOUNT_POSTFIX } from '../../Libraries/Near/constants';
import styles from './CreateAccount.module.css';
import { IsAccountIDAvailableCallback, IsAccountIDValid } from './CreateAccountsHandler';

let isAccountIDAvailableTimeout: NodeJS.Timeout;
export default function CreateAccount(props: {
    onValidAccountId: (account_id: string) => void,
    onStartOver: () => void
}) {
    
    let [validateMessage, setValidateMessage] = useState<string>('Please input a valid account ID');
    let [isAccountIDValid, setIsAccountIDValid] = useState<boolean>(false);
    let accountIdInputRef = createRef<HTMLInputElement>();

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        let charCode = e.key.charCodeAt(0);
        let keyCode = e.code;

        // a-z
        if (charCode >= 97 && charCode <= 122) return;
        // A-Z
        if (charCode >= 65 && charCode <= 90) return;
        // 0-9
        if (charCode >= 48 && charCode <= 57) return; 
        // -
        if (charCode === 45) return;
        // _
        if (charCode === 95) return;
        // backspace
        if (keyCode.toLowerCase() === 'backspace') return;
        // delete
        if (keyCode.toLowerCase() === 'delete') return;
        // ArrowLeft
        if (keyCode.toLowerCase() === 'arrowleft') return;
        // ArrowRight
        if (keyCode.toLowerCase() === 'arrowright') return;

        e.preventDefault();
    }

    function onPaste(e: ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        let accountId = e.clipboardData.getData('text');
        if (IsAccountIDValid(accountId + ACCOUNT_POSTFIX)) {
            e.currentTarget.value = accountId;
        }
    }

    function onChange(e: ChangeEvent<HTMLInputElement>) {
        setIsAccountIDValid(false);
        clearTimeout(isAccountIDAvailableTimeout);
        e.currentTarget.value = e.currentTarget.value.toLowerCase();
        if (e.currentTarget.value.length === 0) {
            setIsAccountIDValid(false);
            setValidateMessage('Please input a valid account ID');
            return;
        }
        let accountId = e.currentTarget.value + ACCOUNT_POSTFIX;

        let isValid = IsAccountIDValid(accountId);
        if (!isValid) {
            setIsAccountIDValid(false);
            setValidateMessage(`Account ID "${accountId}" is invalid`);
            return;
        }
        isAccountIDAvailableTimeout = setTimeout(() => {
            IsAccountIDAvailableCallback(accountId, (isAvailable) => {
                setIsAccountIDValid(isAvailable);
                if (isAvailable) {
                    setValidateMessage(`Account ID "${accountId}" is available`);
                } else {
                    setValidateMessage(`Account ID "${accountId}" is NOT available`);
                }
            });    
        }, 1000)
    }

    return (
        <div className={styles.main}>
            <h1>Create Account</h1>
            <p>After the account creation, the claimable nft will automatically transfered to your newly created account.</p>
            <div className={styles.account_name}>
                <div><b>Account Name</b></div>
                <div className={styles.input_container}>
                    <input ref={accountIdInputRef} onPaste={onPaste} onKeyDown={onKeyDown} type="text" onChange={onChange} maxLength={64}/>
                </div>
                <div className={styles.validate_message}>{validateMessage}</div>
                <div className={styles.account_id_details}>
                    <div>Your account ID can contain any of the following:</div>
                    <ul>
                        <li>Lowercase characters (a-z)</li>
                        <li>Digits (0-9)</li>
                        <li>Characters (_-) can base used as separators</li>
                    </ul>
                    <div>Your account ID CANNOT contain:</div>
                    <ul>
                        <li>Characters "@" or "."</li>
                        <li>Fewer than 2 characters</li>
                        <li>More than 64 characters (including {ACCOUNT_POSTFIX})</li>
                    </ul>
                </div>
            </div>
            <div className={styles.button_group}>
                <button type="button" disabled={!isAccountIDValid} onClick={() => {
                    props.onValidAccountId(accountIdInputRef.current?.value + ACCOUNT_POSTFIX ?? '')
                }}>Create and claim NFT</button>
            </div>
            <div className={styles.button_group}>
                <button type="button" onClick={props.onStartOver}>Start over</button>
            </div>
        </div>
    )
}
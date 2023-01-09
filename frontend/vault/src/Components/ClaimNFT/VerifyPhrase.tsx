import { ChangeEvent, createRef, useState } from 'react';
import styles from './VerifyPhrase.module.css';

export default function VerifyPhrase(props: {
    word: string,
    wordIndex: number,
    onStartOver: () => void,
    onVerified: () => void
}) {
    let [isWordMatch, setIsWordMatch] = useState<boolean>(false);
    let wordInputElementRef = createRef<HTMLInputElement>();


    function onVerify() {
        if (wordInputElementRef.current?.value === props.word) {
            props.onVerified();
        }
    }

    function onWordChange(e: ChangeEvent<HTMLInputElement>) {
        let currentValue = e.currentTarget.value;

        if (currentValue === props.word) {
            setIsWordMatch(true);
        } else {
            setIsWordMatch(false);
        }
    }

    function onStartOver() {
        props.onStartOver();
    }

    return (
        <div className={styles.main}>
            <h1>Verify Phrase</h1>
            <p>Enter the following word from your recovery phrase to complete the setup process.</p>
            <div className={styles.verify_word}>
                <span>Word #{props.wordIndex + 1}</span>
                <div className={styles.input_container}>
                    <input ref={wordInputElementRef} type="text" onChange={onWordChange}/>
                </div>
            </div>
            <div className={styles.button_group}>
                <button type="button" 
                    onClick={onVerify}
                    disabled={!isWordMatch}
                >Verify</button>
            </div>
            <div className={styles.button_group}>
                <button type="button" onClick={onStartOver}>Start over</button>
            </div>
        </div>
    )
}
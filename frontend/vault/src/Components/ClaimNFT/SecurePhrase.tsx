import { generateSeedPhrase, Seed } from 'near-seed-phrase';
import { useState } from 'react';
import styles from './SecurePhrase.module.css';

export default function SecurePhrase(props: {
    onContinue: (seedPhrase: Seed) => void
}) {
    let [seed, setSeed] = useState<Seed>(generateSeedPhrase());


    function copy() {
        navigator.clipboard.writeText(seed.seedPhrase).then(() => {
            alert('copied to clipboard');
        });
    }

    function generateNew() {
        setSeed(generateSeedPhrase());
    }
    
    return (
        <div className={styles.main}>
            <h1>Setup Your Secure Passphrase</h1>
            <p>Write down the following words in order and keep them somewhere safe. Anyone with access to it will also have access your account! You'll be asked to verify your passphrase next.</p>
            <div className={styles.phrase}>
                {seed.seedPhrase.split(' ').map((e, i) => {
                    return (
                        <div key={i}>
                            <span>{i+1}</span><span>{e}</span>
                        </div>
                    )
                })}
            </div>
            <div className={styles.button_group}>
                <button type="button" onClick={copy}>Copy</button>
                <button type="button" onClick={generateNew}>Generate new</button>
            </div>
            <div className={styles.button_group}>
                <button type="button" onClick={() => {
                    props.onContinue(seed)
                }}>Continue</button>
            </div>
        </div>
    )
}
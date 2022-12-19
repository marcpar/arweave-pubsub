import { Seed } from "near-seed-phrase";
import { useState } from "react";
import CreateAccount from "./CreateAccount";
import SecurePhrase from "./SecurePhrase";
import VerifyPhrase from "./VerifyPhrase";


export default function CreateNewAccount() {
    let [currentStage, setCurrentStage] = useState<number>(0);
    let [seed, setSeed] = useState<Seed | undefined>(undefined);

    switch (currentStage) {
        case 0:
            return (
                <SecurePhrase onContinue={(seed) => {
                    setSeed(seed);
                    setCurrentStage(1);
                }} />
            )

        case 1:
            let seedPhraseArray = seed?.seedPhrase.split(' ') ?? [];
            let wordIndex = Math.round(Math.random() * (seedPhraseArray.length - 1));
            return (
                <VerifyPhrase
                    onStartOver={() => {
                        setCurrentStage(0);
                    }}
                    onVerified={() => {
                        setCurrentStage(2);
                    }}
                    wordIndex = {wordIndex}
                    word = {seedPhraseArray[wordIndex]}
                />
            )
        case 2:
            return (
                <CreateAccount onStartOver={() => {
                    setCurrentStage(0);
                }} onValidAccountId = {(accountId) => {
                    alert(`
                        accountID: ${accountId}\n
                        privateKey: ${seed?.secretKey}\n
                        publicKey: ${seed?.publicKey}\n
                        seedPhrase: ${seed?.seedPhrase}
                    `);
                }}/>
            )
        default:
            throw new Error(`Unknown Stage ${currentStage}`)
    }
}
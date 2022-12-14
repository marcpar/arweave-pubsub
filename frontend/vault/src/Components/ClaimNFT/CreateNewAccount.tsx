import { useState } from "react";
import CreateAccount from "./CreateAccount";
import SecurePhrase from "./SecurePhrase";
import VerifyPhrase from "./VerifyPhrase";


export default function CreateNewAccount() {
    let [currentStage, setCurrentStage] = useState<number>(0);

    switch (currentStage) {
        case 0:
            return (
                <SecurePhrase/>
            )
            
        case 1:
            return (
                <VerifyPhrase/>
            )
        case 3:
            return (
                <CreateAccount/>
            )
        default:
            throw new Error(`Unknown Stage ${currentStage}`)
    }
}
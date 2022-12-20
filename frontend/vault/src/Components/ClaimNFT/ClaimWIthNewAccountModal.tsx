import Modal from 'react-modal';
import styles from './ClaimWithNewAccountModal.module.css';
import CreateNewAccount from './CreateNewAccount';

export default function ClaimWithNewAccountModal(props: {
    isOpen: boolean
    onRequestClose: () => void,
    onClaimWithNewAccount: (accountId: string, privateKey: string, publicKey: string) => void,
}) {
    return (
        <Modal isOpen={props.isOpen} style={{
            content: {
                border: 'none',
                borderRadius: '10px',
                height: 'fit-content',
                width: 'fit-content',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: 0,
                boxShadow: '3px 3px 3px rgba(0,0,0,0.1)',
            },
            overlay: {
                backgroundColor: 'rgba(0,0,0,0.6)'
            }
        }}>
            <div className={styles.main}>
                <span onClick={props.onRequestClose}>X</span>
                <CreateNewAccount onCompleteFlow={props.onClaimWithNewAccount}/>
            </div>
        </Modal>
    )
}
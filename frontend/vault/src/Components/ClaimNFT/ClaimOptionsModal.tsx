import Modal from 'react-modal';
import styles from './ClaimOptionsModal.module.css';

export default function ClaimOptionsModal(props: {
    isOpen: boolean,
    onRequestClose?: () => void,
    onClaimWithExistingAccount?: () => void,
    onClaimWithNewAccount?: () => void
}) {
    let onRequestClose = props.onRequestClose ?? (() => {});
    let onClaimWithExistingAccount = props.onClaimWithExistingAccount ?? (() => {});
    let onClaimWithNewAccount = props.onClaimWithNewAccount ?? (() => {});

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
                boxShadow: '3px 3px 3px rgba(0,0,0,0.1)'
            },
            overlay: {
                backgroundColor: 'rgba(0,0,0,0.6)'
            }
        }}>
            <div className={styles.main}>
                <div className={styles.header}>
                    <span onClick={() => onRequestClose()}>X</span>
                </div>
                <div className={styles.content}>
                    <div className={styles.option}>
                        <h1>Claim with an existing account</h1>
                        <p>For users with an existing account on the Near protocol. You can quickly transfer to your account by clicking this button.</p>
                        <button type="button" onClick={onClaimWithExistingAccount}>Claim with existing account</button>
                    </div>
                    <div className={styles.option}>
                        <h1>Claim with a new account</h1>
                        <p>For users without an existing account on the Near protocol. Click this button to create a new account and claim your NFT.</p>
                        <button type="button" onClick={onClaimWithNewAccount}>Claim with a new account</button>
                    </div>
                </div>
                
            </div>
        </Modal>
    );
}
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
                position: 'fixed',
                top: '50%',
                transform: 'translateY(-50%)',
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
                        <h1>Claim with an Existing Account</h1>
                        <p>For users with existing account on the near protocol, you can quickly transfer to your account by clicking the button below.</p>
                        <button type="button" onClick={onClaimWithExistingAccount}>Claim with Existing Account</button>
                    </div>
                    <div className={styles.option}>
                        <h1>Claim with a New Account</h1>
                        <p>For users with no existing account, you can click the button below to claim the nft with a newly created account.</p>
                        <button type="button" onClick={onClaimWithNewAccount}>Claim with a New Account</button>
                    </div>
                </div>
                
            </div>
        </Modal>
    );
}
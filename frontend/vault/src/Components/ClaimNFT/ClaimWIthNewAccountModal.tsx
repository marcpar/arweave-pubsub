import Modal from 'react-modal';
import styles from './ClaimWithNewAccountModal.module.css';
import CreateNewAccount from './CreateNewAccount';

export default function ClaimWithNewAccountModal(props: {
    isOpen: boolean
}) {
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
                <CreateNewAccount/>
            </div>
        </Modal>
    )
}
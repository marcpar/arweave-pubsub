import Modal from 'react-modal';
import { GridLoader } from 'react-spinners';

export default function LoaderModal(props: {
    isOpen: boolean
}) {
    return (
        <Modal isOpen={props.isOpen} style={{
            content: {
                background: 'none',
                border: 'none',
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 'fit-content',
                height: 'fit-content',
                margin: 'none',
                padding: 'none',
            },
            overlay: {
                backgroundColor: 'rgba(0,0,0,0.8)'
            }
        }}>
            <GridLoader color='rgb(0, 98, 190)'/>
        </Modal>
    );
}
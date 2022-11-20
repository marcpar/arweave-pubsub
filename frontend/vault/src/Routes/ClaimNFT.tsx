import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { GetWallet, useIsLoggedInHook } from '../Providers/Wallet';
import style from "./ClaimNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { Dispatch, SetStateAction, useEffect, useState, ChangeEvent } from "react";
import { ClaimDetails, GetVaultContract, GetVaultContractAnonAsync } from '../Libraries/Near/vault';
import Media from '../Components/Media/Media';
import * as nearAPI from "near-api-js";
import Tilt from "react-parallax-tilt";
import { GridLoader, SyncLoader } from "react-spinners";
import Modal from "react-modal";
import { GetConfigInMemory, GetConnection } from '../Libraries/Near/connection';

Modal.setAppElement('#root');

function parseToken(token: string): ClaimDetails {
    let claimDetails!: ClaimDetails
    try {
        claimDetails = JSON.parse(Buffer.from(token, 'base64').toString("utf-8")) as ClaimDetails;
    } catch (e) {
        throw new Error(`Invalid token: ${e}`);
    }

    if (claimDetails.PrivateKey === null || claimDetails.PrivateKey === undefined) {
        throw new Error("invalid token");
    }
    return claimDetails;
}

async function claimHandler(receiver_id: string, claimable_id: string, callback: string) {
    let vaultContract = GetVaultContract(GetWallet().account());
    await vaultContract.claim({
        callbackUrl: callback,
        args: {
            receiver_id: receiver_id,
            claimable_id: claimable_id
        }, gas: nearAPI.DEFAULT_FUNCTION_CALL_GAS
    })
}

async function addressOnChangeHandler(setIsAddressValid: Dispatch<SetStateAction<boolean>>, address: string) {
    console.log(address);
    validateAddress(address);
}

async function validateAddress(address: string): Promise<boolean> {
    let conn = await GetConnection();
    let account = await conn.account(address);
    let accountDetails = await account.getAccountDetails();
    console.log(JSON.stringify(accountDetails));
    let keys = await account.getAccessKeys();
    
    console.log(JSON.stringify(keys));
    let state = await account.state();
    console.log(JSON.stringify(state));
    return true;
}

async function sendHandler(receiver_id: string, nft_account_id: string, token_id: string , private_key: string) {
    let network = process.env.REACT_APP_NEAR_NETWORK as any ?? 'testnet';
    let nearConfig = GetConfigInMemory(network);
    let keyStore = new nearAPI.keyStores.InMemoryKeyStore();
    let accountId = process.env.REACT_APP_VAULT_CONTRACT as string ?? 'vault.world-triathlon.testnet';

    await keyStore.setKey(network, accountId, nearAPI.KeyPair.fromString(private_key));

    nearConfig.keyStore = keyStore;
    let conn = await nearAPI.connect(nearConfig);
    let vaultContract = GetVaultContract(await conn.account(accountId));

    let callback = network === 'mainnet'? `https://app.mynearwallet.com//nft-detail/${nft_account_id}/${token_id}` : `https://testnet.mynearwallet.com//nft-detail/${nft_account_id}/${token_id}`;
    
    await vaultContract.claim({
        callbackUrl: callback,
        args: {
            claimable_id: `${nft_account_id}:${token_id}`,
            receiver_id: receiver_id
        }, gas: nearAPI.DEFAULT_FUNCTION_CALL_GAS
    });
};

type NFTDetails = {
    nftMeta: NFTContractMetadata | null ,
    nftToken: NFTToken | null 
}

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let [searchParams] = useSearchParams();
    let token = searchParams.get('token') ?? '';
    let isLoggedIn = useIsLoggedInHook();
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null >(undefined);
    const [receiverAddress, setReceiverAddress] = useState<string>('');
    const [isClaimable, setIsClaimable] = useState<boolean>(false);
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoadingModalOpen, setIsLoadingModalOpen] = useState<boolean>(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
    const [isClaimButtonHidden, setIsClaimButtonHidden] = useState<boolean>(false);
    const [isReceiverAddressvalid, setIsReceiverAddressValid] = useState<boolean>(false);
    const navigate = useNavigate();

    function claim() {
        setIsModalOpen(true);
    }

    function addressOnChange(event: ChangeEvent<HTMLInputElement>) {
        let receiver = event.currentTarget.value;
        setReceiverAddress(receiver);
        //addressOnChangeHandler(setIsReceiverAddressValid, receiver);
    }

    function send() {
        let claimDetails = parseToken(token);
        setIsModalOpen(false);
        setIsLoadingModalOpen(true);
        sendHandler(receiverAddress, claimDetails.NFTContract, claimDetails.TokenId, claimDetails.PrivateKey).then(() => {
            setIsSuccessModalOpen(true);
            setIsClaimButtonHidden(true);
        }).catch((e) => {
            alert(e);
        }).finally(() => {
            setIsLoadingModalOpen(false);
        });
    }

    useEffect(() => {
        if (nftDetails === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
                console.log(`${nft}:${token_id}`);
                let claimable = await contract.get_claimable({
                    nft_account: nft as string,
                    token_id: token_id as string
                });

                if (claimable === null) {
                    setnftDetails(null);
                    return;
                }

                let nftContract = await GetNFTContract(claimable.nft_account_id)

                setnftDetails({
                    nftMeta: await nftContract.nft_metadata(),
                    nftToken: await nftContract.nft_token({
                        token_id: claimable.token_id
                    })
                });
                
                let claimDetails = parseToken(token);
                let claimKeyPair = nearAPI.utils.KeyPair.fromString(claimDetails.PrivateKey);

                if (claimable !== null && claimable.public_key === claimKeyPair.getPublicKey().toString()) {
                    setIsClaimable(true);
                }
            })
        }
    });
    
    if (nftDetails === undefined) {
        return (
            <div className={style.loader_container}>
                <GridLoader color={"rgb(0, 98, 190)"}/>
            </div>
        );
    }

    if (nftDetails === null || nftDetails.nftMeta === null || nftDetails.nftToken === null) {
        navigate('/not-found');
        return (
            <div>Claimable does not exist</div>
        )
    }
    let fullname: string | undefined = ""
    try {
        let extra = JSON.parse(nftDetails.nftToken.metadata?.extra as string);
        let valuePairs = extra.ValuePairs as Array<{Key: string, Value: string}>;
        let recipientName = valuePairs.find((el) => {
            return el.Key === "RecipientName";
        });
        fullname = recipientName?.Value as string;
    } catch(_) {
        fullname = "Participant";
    }

    return (
        <div className={style.main_container}>
            <div className={style.greetings}>
                <p className={style.full_name}>{fullname}</p>
                <p>Congratulations for competing in the 2022 World Triathlon Age-Group Championships Abu Dhabi.</p>
                <p>Your Race Capsule is ready to be claimed.</p>
            </div>
            <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                <div className={style.card}>
                    <div className={style.card_media}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} isLoadingSetter={setIsMediaLoading} />
                    </div>
                    <div className={style.button_container}>
                        <button className={isMediaLoading || isClaimButtonHidden ? style.hidden : style.button} onClick={claim} disabled={!isClaimable}>Claim</button>
                    </div>
                </div>
            </Tilt>
            <Modal isOpen={isModalOpen} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} onRequestClose={() => setIsModalOpen(false)} style={{
                content: {
                    height: 'fit-content',
                    width: 'fit-content',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    borderRadius: 20,
                    borderStyle: 'none',
                    boxShadow: '3px 3px 3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(154,234,183,1)'
                }
            }}>
                <div className={style.confirm_modal}>
                    <div className={style.address_input_container}>
                        <span>Send to:</span>
                        <input className={style.address_input} type={"text"} onChange={addressOnChange}/>
                    </div>
                    <div className={style.create_wallet_message}>
                        <span>Don't have a wallet yet? Create your account <a href={ process.env.REACT_APP_NEAR_NETWORK === 'mainnet' ? 'https://app.mynearwallet.com/create' : 'https://testnet.mynearwallet.com/create'} target={'_blank'}>here</a></span>
                    </div>
                    <div>
                        <button className={style.proceed_btn} onClick={send}>Send</button>
                        <button className={style.cancel_btn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isLoadingModalOpen} style={{
                content: {
                    height: 'fit-content',
                    width: 'fit-content',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'none',
                    border: 'none'
                }
            }}>
                <SyncLoader color='rgb(42, 73, 220)'/>
            </Modal>
            <Modal isOpen={isSuccessModalOpen} style={{
                content: {
                    height: 'fit-content',
                    width: 'fit-content',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: 0,
                    borderRadius: 10,
                    borderStyle: 'none',
                    boxShadow: '3px 3px 3px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(154,234,183,1)'
                },
            }} shouldCloseOnEsc={true} shouldCloseOnOverlayClick={true} onRequestClose={() => {setIsSuccessModalOpen(false)}}>
                <div className={style.success_message}>
                    <div>Successful transfer, please check your wallet</div>
                    <button onClick={() => {setIsSuccessModalOpen(false)}}>Ok</button>
                </div>
            </Modal>
            
        </div>
    );
}
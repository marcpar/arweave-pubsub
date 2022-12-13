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
import { AddressOnChangeHandler, ClaimWithExistingAccountHandler, ParseToken, SendHandler } from './ClaimNFTHandler';
import ClaimOptionsModal from '../Components/ClaimNFT/ClaimOptionsModal';

type NFTDetails = {
    nftMeta: NFTContractMetadata | null,
    nftToken: NFTToken | null
}

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let token = window.location.hash ?? '';
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null>(undefined);
    const [isClaimable, setIsClaimable] = useState<boolean>(false);
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
    const [isClaimButtonHidden, setIsClaimButtonHidden] = useState<boolean>(false);
    const [isClaimOptionsModalOpen, setIsClaimOptionsModalOpen] = useState<boolean>(false);

    const navigate = useNavigate();

    function claimOnClick() {
        setIsClaimOptionsModalOpen(true);
    }

    function claimOnExistingAccount() {
        let uuid = window.crypto.randomUUID();
        localStorage.setItem(uuid, JSON.stringify(ParseToken(token)));
        ClaimWithExistingAccountHandler(uuid);
    }

    function claimWithNewAccount() {
        setIsClaimOptionsModalOpen(false);
    }

    useEffect(() => {
        if (nftDetails === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
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

                let claimDetails = ParseToken(token);
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
                <GridLoader color={"rgb(0, 98, 190)"} />
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
        let valuePairs = extra.ValuePairs as Array<{ Key: string, Value: string }>;
        let recipientName = valuePairs.find((el) => {
            return el.Key === "RecipientName";
        });
        fullname = recipientName?.Value as string;
    } catch (_) {
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
                        <button className={isMediaLoading || isClaimButtonHidden ? style.hidden : style.button} onClick={claimOnClick} disabled={!isClaimable}>Claim</button>
                    </div>
                </div>
            </Tilt>
            <ClaimOptionsModal isOpen={isClaimOptionsModalOpen} onRequestClose={() => { setIsClaimOptionsModalOpen(false) }} onClaimWithNewAccount={claimWithNewAccount} onClaimWithExistingAccount={claimOnExistingAccount} />
        </div>
    );
}
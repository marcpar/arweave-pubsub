import { GetConfig, GetConnection } from "../Libraries/Near/connection";
import * as nearAPI from "near-api-js";
import { useState, Dispatch, SetStateAction, useEffect } from "react";

console.log(process.env.REACT_APP_NEAR_NETWORK);
let _network = process.env.REACT_APP_NEAR_NETWORK ?? 'testnet';
let _config = GetConfig(_network as any);
let _near: nearAPI.Near;
let _wallet: nearAPI.WalletConnection;
let _isLoggedInSetters: Map<number, Dispatch<SetStateAction<boolean>>> = new Map();
let _isLoggedInSettersId = 0;

async function Login(): Promise<void> {
    await initNear();
    if (_wallet.isSignedIn()) {
        notifyIsLoggedInSetters(true);
        return;
    }
    return _wallet.requestSignIn({});
}

async function Logout(): Promise<void> {
    await initNear();
    _wallet.signOut();
    notifyIsLoggedInSetters(false);
}

async function IsLoggedIn(): Promise<boolean> {
    await initNear();

    let isSignedIn = _wallet.isSignedIn();
    notifyIsLoggedInSetters(isSignedIn);
    return isSignedIn;
}

function GetWallet(): nearAPI.WalletConnection {
    return _wallet;
}

async function initNear(): Promise<void> {
    if (!_near) {
        _near = await GetConnection(_config);
        _wallet = new nearAPI.WalletConnection(_near, '');
    }
}

function useIsLoggedInHook(): boolean {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    useEffect(() => {
        let id = _isLoggedInSettersId++;
        _isLoggedInSetters.set(id, setIsLoggedIn);
        IsLoggedIn();
        return () => {
            _isLoggedInSetters.delete(id);
        }
    }, []);
    return isLoggedIn;
}

function notifyIsLoggedInSetters(isLoggedIn: boolean) {
    _isLoggedInSetters.forEach((setter) => {
        setter(isLoggedIn);
    })
}

export {
    Login,
    Logout,
    IsLoggedIn,
    GetWallet,
    useIsLoggedInHook
}
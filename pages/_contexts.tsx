"use client";

import { useConnection, useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { UserData } from "../components/state/state";
import { RunGPA, GPAccount } from "../components/state/rpc";
import { BASH, Config, PROGRAM } from "../components/state/constants";
import { PublicKey, Connection } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../components/context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { bignum_to_num, TokenAccount } from "../components/blog/apps/common";
import { TwitterUser } from "../components/state/interfaces";

const GetProgramData = async (check_program_data, setProgramData) => {
    if (!check_program_data.current) return;

    let list = await RunGPA();

    setProgramData(list);

    check_program_data.current = false;
};

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [user_data, setUserData] = useState<Map<string, UserData> | null>(new Map());
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);
    const [twitter, setTwitter] = useState<TwitterUser | null>(null);

    const [userBashBalance, setUserBashBalance] = useState<number>(0);
    const [new_program_data, setNewProgramData] = useState<any>(null);


    const update_program_data = useRef<number>(0);
    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);

    const user_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    useEffect(() => {
        if (update_program_data.current === 0 || new_program_data === null) return;

        update_program_data.current -= 1;

        let event_data = Buffer.from(new_program_data.accountInfo.data);
        let account_key = new_program_data.accountId;

        if (event_data[0] === 1) {
            //console.log("updating user data from context");

            const [user] = UserData.struct.deserialize(event_data);

            user_data.set(user.user_key.toString(), user);
            setUserData(new Map(user_data));
            if (wallet.publicKey !== null && user.user_key.equals(wallet.publicKey)) {
                setCurrentUserData(user);
            }
            return;
        }
    }, [new_program_data, wallet, user_data]);

    const check_program_update = useCallback(async (result: any) => {
        update_program_data.current += 1;
        setNewProgramData(result);
    }, []);

    const checkUserBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let token_key = getAssociatedTokenAddressSync(BASH, wallet.publicKey, true, TOKEN_2022_PROGRAM_ID);
        try {
            let balance = await connection.getTokenAccountBalance(token_key);
            setUserBashBalance(parseInt(balance.value.amount));
        } catch (error) {
            console.log(error);
        }
    }, [wallet, connection]);

    const check_user_balance = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        try {
            let event_data = result.data;
            const [token_account] = TokenAccount.struct.deserialize(event_data);
            let amount = bignum_to_num(token_account.amount);
            setUserBashBalance(amount);
        } catch (error) {}
    }, []);

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (user_balance_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            checkUserBalance();
            let token_key = getAssociatedTokenAddressSync(BASH, wallet.publicKey, true, TOKEN_2022_PROGRAM_ID);

            user_balance_ws_id.current = connection.onAccountChange(token_key, check_user_balance, "confirmed");
        }

        if (program_ws_id.current === null) {
            program_ws_id.current = connection.onProgramAccountChange(PROGRAM, check_program_update, "confirmed");
        }
    }, [wallet, check_user_balance, checkUserBalance, check_program_update]);

    useEffect(() => {
        if (program_data === null) return;

        //console.log("update data");
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        let user_data: Map<string, UserData> = new Map<string, UserData>();

        //console.log("program_data", program_data.length);
        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;

            if (data[0] === 1) {
                const [user] = UserData.struct.deserialize(data);
                //console.log("user", user);
                user_data.set(user.user_key.toString(), user);
                continue;
            }
        }

        setUserData(user_data);

        if (have_wallet) {
            if (user_data.has(wallet.publicKey.toString())) {
                setCurrentUserData(user_data.get(wallet.publicKey.toString()));
            }
        }
    }, [program_data, wallet]);

    useEffect(() => {
        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData);
    }, []);

    return (
        <AppRootContextProvider currentUserData={current_user_data} userBashBalance={userBashBalance} twitter={twitter} setTwitter={setTwitter}> 
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;

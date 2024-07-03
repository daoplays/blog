"use client";

import { useConnection, useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { AccountType, EntryData, LeaderboardData, ListingData, UserData } from "../components/state/state";
import { RunGPA, GPAccount, getMintData, fetchWithTimeout } from "../components/state/rpc";
import { BASH, Config, PDA_ACCOUNT_SEED, PROGRAM, WHITELIST } from "../components/state/constants";
import { PublicKey, Connection } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../components/context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { bignum_to_num, request_raw_account_data, request_token_amount, TokenAccount, uInt32ToLEBytes } from "../components/blog/apps/common";
import { MintData, NFTData, TwitterUser } from "../components/state/interfaces";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, Database } from "firebase/database";
import { AssetV1, getAssetV1GpaBuilder, Key } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

const GetProgramData = async (check_program_data, setProgramData, setTwitterDB, setDatabase) => {
    if (!check_program_data.current) return;

    check_program_data.current = false;
    let list = await RunGPA();

    setProgramData(list);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);

    setDatabase(database)

    const twitter_users = await get(ref(database, "BlinkBash/twitter"));
    let entry = twitter_users.val();
    if (entry === null) {
        return;
    }
    let twitter_map = new Map<string, TwitterUser>();
    Object.entries(entry).forEach(([key, value]) => {
        let json = JSON.parse(value.toString());
        let twitter_user: TwitterUser = {
            name: json.name,
            username: json.username,
            profile_image_url: json.profile_image_url,
        };
        twitter_map.set(key, twitter_user);
    });
    setTwitterDB(twitter_map);
};

const GetTokenMintData = async (trade_keys: String[], setMintMap) => {
    //console.log("GETTING MINT DATA");
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

    let pubkeys: PublicKey[] = [];
    for (let i = 0; i < trade_keys.length; i++) {
        pubkeys.push(new PublicKey(trade_keys[i]));
    }
    let result = await connection.getMultipleAccountsInfo(pubkeys, "confirmed");
    //console.log(result);
    let mint_map = new Map<String, MintData>();
    for (let i = 0; i < result.length; i++) {
        try {
            let mint = unpackMint(pubkeys[i], result[i], result[i].owner);
            let mint_data = await getMintData(connection, mint, result[i].owner);

            mint_map.set(pubkeys[i].toString(), mint_data);
            //console.log("mint; ", mint.address.toString());
        } catch (error) {
            console.log("bad mint", pubkeys[i].toString());
            console.log(error);
        }
    }

    //console.log("SET MINT MAP", mint_map);
    setMintMap(mint_map);
};

const GetNFTData = async (nft_keys: String[], setNFTMap) => {
    
    const umi = createUmi(Config.RPC_NODE, "confirmed");
    let pda = PublicKey.findProgramAddressSync([uInt32ToLEBytes(PDA_ACCOUNT_SEED)], PROGRAM)[0];

    let pda_umiKey = publicKey(pda.toString());

    const assets = await getAssetV1GpaBuilder(umi)
        .whereField("key", Key.AssetV1)
        .whereField('owner', pda_umiKey)
        .getDeserialized();

    let asset_map = new Map<String, NFTData>();
    await Promise.all(assets.map(async (asset) => {
        let nftdata: NFTData = {
            mint: asset,
            uri: asset.uri,
            icon: ""
        };

        try {
            const response = await fetchWithTimeout(asset.uri, 3000);
            const uri_json = await response.json();
            nftdata.icon = uri_json["image"];
        } catch (error) {
            console.error(`Error fetching data for asset ${asset.publicKey}:`, error);
        }

        asset_map.set(asset.publicKey.toString(), nftdata);
    }));

    
    setNFTMap(asset_map)
};


const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [database, setDatabase] = useState<Database | null>(null);
    const [user_data, setUserData] = useState<Map<string, UserData> | null>(new Map());
    const [user_ids, setUserIDs] = useState<Map<number, string> | null>(new Map());
    const [listing_data, setListingData] = useState<Map<string, ListingData> | null>(new Map());
    const [leaderboard_data, setLeaderboardData] = useState<Map<string, LeaderboardData> | null>(new Map());
    const [entry_data, setEntryData] = useState<Map<string, EntryData> | null>(new Map());

    const [mintData, setMintData] = useState<Map<string, MintData> | null>(null);
    const [nftData, setNFTData] = useState<Map<string, NFTData> | null>(null);

    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);
    const [twitter, setTwitter] = useState<TwitterUser | null>(null);

    //database entries
    const [twitter_db, setTwitterDB] = useState<Map<string, TwitterUser> | null>(null);

    const [userBashBalance, setUserBashBalance] = useState<number>(0);
    const [userWLBalance, setUserWLBalance] = useState<number>(0);

    const [new_program_data, setNewProgramData] = useState<any>(null);

    const update_program_data = useRef<number>(0);
    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);

    const user_balance_ws_id = useRef<number | null>(null);
    const user_wl_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    useEffect(() => {
        if (update_program_data.current === 0 || new_program_data === null) return;

        update_program_data.current -= 1;

        let event_data = Buffer.from(new_program_data.accountInfo.data);
        let account_key = new_program_data.accountId;

        if (event_data[0] === AccountType.User) {
            const [user] = UserData.struct.deserialize(event_data);

            user_data.set(user.user_key.toString(), user);
            setUserData(new Map(user_data));
            if (wallet.publicKey !== null && user.user_key.equals(wallet.publicKey)) {
                setCurrentUserData(user);
            }
            return;
        }

        if (event_data[0] === AccountType.Listing) {
            //console.log("updating user data from context");

            const [listing] = ListingData.struct.deserialize(event_data);
            listing_data.set(listing.item_address.toString(), listing);
            setListingData(new Map(listing_data));
            
            return;
        }

        if (event_data[0] === AccountType.Entry) {
            const [entry] = EntryData.struct.deserialize(event_data);
            entry_data.set(account_key.toString(), entry);
            setEntryData(new Map(entry_data));

            return;
        }

        if (event_data[0] === AccountType.Leaderboard) {
            const [leaderboard] = LeaderboardData.struct.deserialize(event_data);
            leaderboard_data.set(account_key.toString(), leaderboard);
            setLeaderboardData(new Map(leaderboard_data));

            return;
        }
    }, [new_program_data, wallet, user_data, listing_data, entry_data, leaderboard_data]);

    const check_program_update = useCallback(async (result: any) => {
        update_program_data.current += 1;
        setNewProgramData(result);
    }, []);

    const checkUserBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let token_key = getAssociatedTokenAddressSync(BASH, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
        try {
            let balance = await connection.getTokenAccountBalance(token_key);
            setUserBashBalance(parseInt(balance.value.amount));
        } catch (error) {
            console.log(error);
        }
    }, [wallet, connection]);

    const checkUserWLBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let token_key = getAssociatedTokenAddressSync(WHITELIST, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
        try {
            let balance = await connection.getTokenAccountBalance(token_key);
            setUserWLBalance(parseInt(balance.value.amount));
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

    const check_user_wl_balance = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        try {
            let event_data = result.data;
            const [token_account] = TokenAccount.struct.deserialize(event_data);

            let amount = bignum_to_num(token_account.amount);
            setUserWLBalance(amount);
        } catch (error) {}
    }, []);

    // launch account subscription handler
    useEffect(() => {
        if (user_balance_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            checkUserBalance();
            let token_key = getAssociatedTokenAddressSync(BASH, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
            user_balance_ws_id.current = connection.onAccountChange(token_key, check_user_balance, "confirmed");
        }

        if (user_wl_balance_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            checkUserWLBalance();
            let token_key = getAssociatedTokenAddressSync(WHITELIST, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
            user_wl_balance_ws_id.current = connection.onAccountChange(token_key, check_user_wl_balance, "confirmed");
        }

        if (program_ws_id.current === null) {
            program_ws_id.current = connection.onProgramAccountChange(PROGRAM, check_program_update, "confirmed");
        }
    }, [wallet, connection, check_user_balance, checkUserBalance, checkUserWLBalance, check_program_update, check_user_wl_balance]);

    useEffect(() => {
        if (program_data === null) return;

        // console.log("update data");
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        let user_data: Map<string, UserData> = new Map<string, UserData>();
        let user_ids: Map<number, string> = new Map<number, string>();
        let listings: Map<string, ListingData> = new Map<string, ListingData>();
        let entries: Map<string, EntryData> = new Map<string, EntryData>();
        let leaderboards: Map<string, LeaderboardData> = new Map<string, LeaderboardData>();

        let token_listings: string[] = [];
        let nft_listings: string[] = [];

        //console.log("program_data", program_data.length);
        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;
            //console.log(program_data)
            if (data[0] === AccountType.User) {
                const [user] = UserData.struct.deserialize(data);
                console.log("user", user);
                user_data.set(user.user_key.toString(), user);
                user_ids.set(user.user_id, user.user_key.toString());
                continue;
            }

            if (data[0] === AccountType.Listing) {
                const [listing] = ListingData.struct.deserialize(data);
                listings.set(listing.item_address.toString(), listing);
                if (listing.item_type === 1) {
                    token_listings.push(listing.item_address.toString());
                }
                if (listing.item_type === 2) {
                    nft_listings.push(listing.item_address.toString());
                }
                continue;
            }

            if (data[0] === AccountType.Entry) {
                const [entry] = EntryData.struct.deserialize(data);
                entries.set(program_data[i].pubkey.toString(), entry);
                continue;
            }

            if (data[0] === AccountType.Leaderboard) {
                const [leaderboard] = LeaderboardData.struct.deserialize(data);
                leaderboards.set(program_data[i].pubkey.toString(), leaderboard);
                continue;
            }
        }

        setUserData(user_data);
        setUserIDs(user_ids);
        setListingData(listings);
        setEntryData(entries)
        setLeaderboardData(leaderboards);

        if (have_wallet) {
            if (user_data.has(wallet.publicKey.toString())) {
                setCurrentUserData(user_data.get(wallet.publicKey.toString()));
            }
        }

        GetTokenMintData(token_listings, setMintData);
        GetNFTData(nft_listings, setNFTData);

    }, [program_data, wallet]);

    useEffect(() => {
        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setTwitterDB, setDatabase);
    }, []);

    return (
        <AppRootContextProvider
            database={database}
            userList={user_data}
            userIDs={user_ids}
            twitterList={twitter_db}
            listingList={listing_data}
            tokenList={mintData}
            nftList={nftData}
            entryList={entry_data}
            leaderboardList={leaderboard_data}

            currentUserData={current_user_data}
            userBashBalance={userBashBalance}
            userWLBalance={userWLBalance}
            twitter={twitter}
            setTwitter={setTwitter}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;

"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { EntryData, LeaderboardData, ListingData, UserData } from "../state/state";
import { MintData, NFTData, TwitterUser } from "../state/interfaces";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import { Database } from "firebase/database";
interface AppRootTypes {
    database: Database,
    userList: Map<string, UserData>;
    twitterList: Map<string, TwitterUser>;
    listingList: Map<string, ListingData>;
    tokenList: Map<string, MintData>;
    nftList: Map<string, NFTData>;
    entryList: Map<string, EntryData>;
    leaderboardList: Map<string, LeaderboardData>;

    currentUserData: UserData;
    userBashBalance: number;
    userWLBalance: number;
    twitter: TwitterUser;
    setTwitter: Dispatch<SetStateAction<TwitterUser>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    database,
    userList,
    twitterList,
    listingList,
    tokenList,
    nftList,
    entryList,
    leaderboardList,
    currentUserData,
    userBashBalance,
    userWLBalance,
    twitter,
    setTwitter,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                database,
                userList,
                twitterList,
                listingList,
                tokenList,
                nftList,
                entryList,
                leaderboardList,
                currentUserData,
                userBashBalance,
                userWLBalance,
                twitter,
                setTwitter,
            }}
        >
            {children}
        </AppRootContext.Provider>
    );
};

const useAppRoot = () => {
    const context = useContext(AppRootContext);

    if (!context) {
        throw new Error("No AppRootContext");
    }

    return context;
};

export default useAppRoot;

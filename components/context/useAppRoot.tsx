"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { ListingData, UserData } from "../state/state";
import { MintData, NFTData, TwitterUser } from "../state/interfaces";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
interface AppRootTypes {
    userList: Map<string, UserData>;
    twitterList: Map<string, TwitterUser>;
    listingList: Map<string, ListingData>;
    tokenList: Map<string, MintData>;
    nftList: Map<string, NFTData>;
    currentUserData: UserData;
    userBashBalance: number;
    userWLBalance: number;
    twitter: TwitterUser;
    setTwitter: Dispatch<SetStateAction<TwitterUser>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    userList,
    twitterList,
    listingList,
    tokenList,
    nftList,
    currentUserData,
    userBashBalance,
    userWLBalance,
    twitter,
    setTwitter,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                userList,
                twitterList,
                listingList,
                tokenList,
                nftList,
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

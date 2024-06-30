"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { UserData } from "../state/state";
import { TwitterUser } from "../state/interfaces";
interface AppRootTypes {
    currentUserData: UserData;
    userBashBalance: number;
    twitter: TwitterUser;
    setTwitter: Dispatch<SetStateAction<TwitterUser>>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({ children, currentUserData, userBashBalance, twitter, setTwitter }: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                currentUserData,
                userBashBalance,
                twitter,
                setTwitter
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

import React, { useMemo } from "react";

import * as web3 from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { GenRandoms } from "./Gen_Randoms";
import { AirDropApp } from "./AirDrop";
require("@solana/wallet-adapter-react-ui/styles.css");

function RandomApp() {
    return (
        <>
            <AirDropApp />
            <GenRandoms />
        </>
    );
}

export function RandomExample() {
    return <RandomApp />;
}

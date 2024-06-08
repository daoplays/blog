import React, { useMemo } from "react";

import * as web3 from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { GenSeed } from "./Gen_Seeds";
import { AirDropApp } from "./AirDrop";
require("@solana/wallet-adapter-react-ui/styles.css");

function RandomApp() {
  return (
    <>
      <AirDropApp />
      <GenSeed />
    </>
  );
}

export function SeedExample() {
  return <RandomApp />;
}

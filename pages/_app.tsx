import { ChakraProvider, HStack, VStack } from "@chakra-ui/react";
import { theme } from "../chakra";
import "bootstrap/dist/css/bootstrap.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "../styles/fonts.css";
import "../styles/table.css";
import "../styles/global.css";
import ContextProviders from "./_contexts";
import NoSSR from "../utils/NoSSR";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { Config } from "../components/state/constants";
import { useMemo } from "react";
import { ConnectionConfig } from "@solana/web3.js";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

import type { AppProps } from "next/app";
import Navigation from "../components/blinkbash/Navigation";
import DialectCTA from "../components/blinkbash/dialect";
import AppRootPage from "./_layout";

function MyApp({ Component, pageProps }: AppProps) {
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    const connectionConfig: ConnectionConfig = {
        wsEndpoint: Config.WSS_NODE,
        commitment: "confirmed",
    };

    return (
        <NoSSR>
            <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss={false}
                pauseOnHover={false}
                rtl={false}
                draggable
                theme="light"
            />
            <ChakraProvider theme={theme}>
                <ConnectionProvider endpoint={Config.RPC_NODE} config={connectionConfig}>
                    <WalletProvider wallets={wallets} autoConnect>
                        <WalletModalProvider>
                            <ContextProviders>
                                <AppRootPage>
                                    <Component {...pageProps} />
                                </AppRootPage>
                            </ContextProviders>
                        </WalletModalProvider>
                    </WalletProvider>
                </ConnectionProvider>
            </ChakraProvider>
        </NoSSR>
    );
}

export default MyApp;

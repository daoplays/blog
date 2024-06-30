import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import "bootstrap/dist/css/bootstrap.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "../styles/fonts.css";
import "../styles/table.css";
import "../styles/global.css";

import NoSSR from "../utils/NoSSR";
import { usePathname } from "next/navigation";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../components/blog/apps/common";
import { useMemo } from "react";
import { ConnectionConfig } from "@solana/web3.js";
import NavigationBonk from "../components/bonkathon/topNav";
import { bonkathonLinks } from "./bonkathon2024";

function MyApp({ Component, pageProps }) {
  const pathname = usePathname();

  const wallets = useMemo(() => [], []);

  const connectionConfig: ConnectionConfig = {
    wsEndpoint: DEV_WSS_NODE,
    commitment: "confirmed",
  };

  console.log({ theme });
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
        <ConnectionProvider endpoint={DEV_RPC_NODE} config={connectionConfig}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {bonkathonLinks.includes(pathname) ? (
                <NavigationBonk />
              ) : (
                <Navigation />
              )}
              <Component {...pageProps} />
              {!bonkathonLinks.includes(pathname) && <Footer />}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ChakraProvider>
    </NoSSR>
  );
}

export default MyApp;

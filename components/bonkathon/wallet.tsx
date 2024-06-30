import { Text, Box, HStack } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaSignOutAlt } from "react-icons/fa";
import UseWalletConnection from "../blog/apps/commonHooks/useWallet";
import trimAddress from "../blog/apps/utils/trimAddress";
require("@solana/wallet-adapter-react-ui/styles.css");

export function DisconnectWalletButton() {
    const wallet = useWallet();
    const { handleDisconnectWallet } = UseWalletConnection();

    return (
        <>
            <Box
                as="button"
                onClick={() => {
                    handleDisconnectWallet();
                }}
            >
                <HStack
                    align="center"
                    color="white"
                    className="font-face-rk"
                    style={{ backgroundColor: "#683309", borderRadius: 20 }}
                    py={1}
                    px={3}
                >
                    <FaSignOutAlt size={18} />
                    <Text m={0} style={{}}>
                        {trimAddress(wallet.publicKey.toString())}
                    </Text>
                </HStack>
            </Box>
        </>
    );
}

export function ConnectWalletButton() {
    const { handleConnectWallet } = UseWalletConnection();

    return (
        <>
            <Box as="button" onClick={handleConnectWallet}>
                <div className="font-face-rk">
                    <Text
                        style={{
                            backgroundColor: "#683309",
                            borderRadius: 20,
                            padding: "5px 10px 2px 10px",
                            color: "white",
                            marginTop: 10,
                            position: "relative",
                            top: 2,
                        }}
                    >
                        CONNECT WALLET
                    </Text>
                </div>
            </Box>
        </>
    );
}

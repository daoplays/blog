import { HStack, Link, Text } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { ConnectWalletButton, DisconnectWalletButton } from "./wallet";
import useResponsive from "../../hooks/useResponsive";

function NavigationBonk() {
  const router = useRouter();
  const wallet = useWallet();
  const { md } = useResponsive();

  return (
    <HStack
      bg="url(/images/header_fill.jpeg)"
      backgroundSize="cover"
      height={50}
      px={4}
      alignItems="center"
      justify="space-between"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      style={{
        boxShadow: "0px 2px 13px 0px rgba(0, 0, 0, 0.50)",
      }}
    >
      <Link href="/bonkathon2024" style={{ textDecoration: "none" }}>
        <Text
          fontSize={md ? "medium" : "x-large"}
          color={"#683309"}
          className="font-face-kg"
          style={{ cursor: "pointer", margin: "auto 0" }}
        >
          Bonkathon 2024
        </Text>
      </Link>

      <HStack
        gap={2}
        mt={-2}
        align="center"
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          width: "fit-content",
        }}
      >
        <Link href="/bonkathon2024/create" style={{ textDecoration: "none" }}>
          <Text m={0} fontSize="2xl" color="#683309" fontWeight={500}>
            [Create]
          </Text>
        </Link>
        <Link href="/bonkathon2024" style={{ textDecoration: "none" }}>
          <Text m={0} fontSize="2xl" color="#683309" fontWeight={500}>
            [View]
          </Text>
        </Link>
      </HStack>

      <>
        {wallet.publicKey && <DisconnectWalletButton />}
        {wallet.publicKey === null && <ConnectWalletButton />}
      </>
    </HStack>
  );
}

export default NavigationBonk;

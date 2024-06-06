import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
  Dispatch,
} from "react";
import { SetStateAction } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import TradePage from "./trade";
import { Flex, HStack, VStack, Text, Center, Box } from "@chakra-ui/react";
import SideNav from "./sideNav";
import { AMMData, AMMLaunch, PROGRAM, Screen } from "./state";
import LaunchAMM from "./launch";
import {
  DEV_RPC_NODE,
  DEV_WSS_NODE,
  GPAccount,
  MintData,
  RunGPA,
  setMintData,
} from "../blog/apps/common";
import { Connection, ConnectionConfig, PublicKey } from "@solana/web3.js";
import AMMTable from "./table";
import useResponsive from "../../hooks/useResponsive";

require("@solana/wallet-adapter-react-ui/styles.css");

const GetProgramData = async (check_program_data, setProgramData) => {
  if (!check_program_data.current) return;

  let list = await RunGPA(PROGRAM);

  setProgramData(list);

  check_program_data.current = false;
};

const GetTradeMintData = async (trade_keys: PublicKey[], setMintMap) => {
  let mint_map = new Map<String, MintData>();
  for (let i = 0; i < trade_keys.length; i++) {
    if (mint_map.has(trade_keys[i].toString())) {
      continue;
    }

    let mint_data = await setMintData(trade_keys[i].toString());
    mint_map.set(trade_keys[i].toString(), mint_data);
  }
  setMintMap(mint_map);
};

function App() {
  const wallet = useWallet();

  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(true);
  const [screen, setScreen] = useState<Screen>(Screen.table);
  const [selected, setSelected] = useState<string>("View");
  const [program_data, setProgramData] = useState<GPAccount[] | null>(null);
  const [amm_data, setAMMData] = useState<AMMData[]>([]);
  const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);
  const [amm_launches, setAMMLaunches] = useState<Map<
    String,
    AMMLaunch
  > | null>(null);
  const [current_launch, setCurrentLaunch] = useState<AMMLaunch | null>(null);

  const { xs, sm, md } = useResponsive();
  const last_selected = useRef<string>("View");
  const check_program_data = useRef<boolean>(true);

  useEffect(() => {
    GetProgramData(check_program_data, setProgramData);
  }, []);

  useEffect(() => {
    if (program_data === null) return;

    let amm_data: AMMData[] = [];

    console.log("program_data", program_data.length);
    for (let i = 0; i < program_data.length; i++) {
      let data = program_data[i].data;

      if (data[0] === 6) {
        try {
          const [amm] = AMMData.struct.deserialize(data);
          amm_data.push(amm);
        } catch (error) {
          console.log(error);
        }
      }
    }
    setAMMData(amm_data);

    // set up the map for the trade page
    let trade_mints: PublicKey[] = [];
    for (let i = 0; i < amm_data.length; i++) {
      trade_mints.push(amm_data[i].base_mint);
      trade_mints.push(amm_data[i].quote_mint);
    }

    GetTradeMintData(trade_mints, setMintData);
  }, [program_data]);

  useEffect(() => {
    if (amm_data === null || mintData === null) return;

    let amm_launches = new Map<String, AMMLaunch>();
    for (let i = 0; i < amm_data.length; i++) {
      let amm = amm_data[i];
      let base_mint_data = mintData.get(amm.base_mint.toString());
      let quote_mint_data = mintData.get(amm.quote_mint.toString());

      let launch: AMMLaunch = {
        amm_data: amm,
        base: base_mint_data,
        quote: quote_mint_data,
      };

      let amm_seed_keys = [];
      if (amm.base_mint.toString() < amm.quote_mint.toString()) {
        amm_seed_keys.push(amm.base_mint);
        amm_seed_keys.push(amm.quote_mint);
      } else {
        amm_seed_keys.push(amm.quote_mint);
        amm_seed_keys.push(amm.base_mint);
      }

      let amm_data_account = PublicKey.findProgramAddressSync(
        [
          amm_seed_keys[0].toBytes(),
          amm_seed_keys[1].toBytes(),
          Buffer.from("AMM"),
        ],
        PROGRAM,
      )[0];

      amm_launches.set(amm_data_account.toString(), launch);
    }

    console.log(amm_launches);

    setAMMLaunches(amm_launches);
  }, [amm_data, mintData]);

  useEffect(() => {
    if (selected == last_selected.current) {
      return;
    }

    last_selected.current = selected;
    if (selected === "Create") {
      setScreen(Screen.create);
    }
    if (selected === "View") {
      setScreen(Screen.table);
    }
    if (selected === "Trade") {
      setScreen(Screen.trade);
    }
  }, [selected]);

  function ConnectWalletButton() {
    const { setVisible } = useWalletModal();

    const handleConnectWallet = useCallback(async () => {
      setVisible(true);
    }, [setVisible]);

    return (
      <>
        <Box mt="10px" mb="1rem" as="button" onClick={handleConnectWallet}>
          <div className="font-face-sfpb">
            <Text
              borderColor="white"
              borderWidth="1px"
              width="140px"
              height="25px"
              fontSize={"16px"}
              textAlign="center"
              color="white"
              mb="0"
            >
              CONNECT
            </Text>
          </div>
        </Box>
      </>
    );
  }

  const DisconnectWallet = useCallback(async () => {
    console.log("call wallet disconnect");
    await wallet.disconnect();
  }, [wallet]);

  function DisconnectWalletButton() {
    return (
      <>
        <Box mt="10px" mb="1rem" as="button" onClick={() => DisconnectWallet()}>
          <div className="font-face-sfpb">
            <Text
              borderColor="white"
              borderWidth="1px"
              width="140px"
              height="25px"
              fontSize={"16px"}
              textAlign="center"
              color="white"
              mb="0"
            >
              DISCONNECT
            </Text>
          </div>
        </Box>
      </>
    );
  }

  return (
    <Center
      style={{
        background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)",
      }}
      width="100%"
      mt="10px"
      mb="50px"
    >
      <VStack width="100%">
        <Flex
          px={4}
          py={18}
          gap={4}
          alignItems="center"
          justifyContent={!sm ? "space-between" : "end"}
          style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
          w={"100"}
        >
          <HStack spacing={3} zIndex={99}>
            {["Create", "View"].map((name, i) => {
              const isActive = selected === name;

              const baseStyle = {
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              };

              const activeStyle = {
                color: "white",
                borderBottom: isActive ? "2px solid white" : "",
                opacity: isActive ? 1 : 0.5,
              };

              return (
                <HStack
                  key={i}
                  style={{
                    ...baseStyle,
                    ...activeStyle,
                  }}
                  onClick={() => {
                    setSelected(name);
                  }}
                  px={4}
                  py={2}
                  mt={-2}
                  w={"fit-content"}
                  justify="center"
                >
                  <Text m={"0 auto"} fontSize="medium" fontWeight="semibold">
                    {name}
                  </Text>
                </HStack>
              );
            })}
            {wallet.publicKey && <DisconnectWalletButton />}
            {!wallet.publicKey && <ConnectWalletButton />}
          </HStack>
        </Flex>
        {screen === Screen.create && <LaunchAMM />}
        {screen === Screen.trade && (
          <>
            <TradePage launch={current_launch} />
          </>
        )}

        {screen === Screen.table && (
          <AMMTable
            ammList={amm_launches}
            setCurrentLaunch={setCurrentLaunch}
            setSelected={setSelected}
          />
        )}
      </VStack>
    </Center>
  );
}
export function ShortsApp() {
  return <App />;
}

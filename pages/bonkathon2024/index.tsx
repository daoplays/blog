import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  AMMData,
  AMMLaunch,
  PROGRAM,
  Screen,
} from "../../components/bonkathon/state";
import { ConnectionConfig, PublicKey } from "@solana/web3.js";
import { DEV_RPC_NODE, DEV_WSS_NODE, GPAccount, MintData } from "../../components/blog/apps/common";
import {
  GetProgramData,
  GetTradeMintData,
} from "../../components/blog/apps/shorts/App";
import useResponsive from "../../hooks/useResponsive";
import AMMTable from "../../components/bonkathon/table";
import { HStack } from "@chakra-ui/react";
import TradePage from "../../components/bonkathon/trade";

const ViewAMMs = () => {
  const { lg, xl } = useResponsive();

  const [program_data, setProgramData] = useState<GPAccount[] | null>(null);
  const [amm_data, setAMMData] = useState<AMMData[]>([]);
  const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);
  const [amm_launches, setAMMLaunches] = useState<Map<
    String,
    AMMLaunch
  > | null>(null);

  const [selected, setSelected] = useState<string>("View");
  const [current_launch, setCurrentLaunch] = useState<AMMLaunch | null>(null);
  const [screen, setScreen] = useState<Screen>(Screen.table);

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
        PROGRAM
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

  return (
    <main
      style={{
        background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)",
        height: "100vh",
      }}
    >
      <HStack
        align="start"
        h="100%"
        style={{
          width: screen === Screen.trade ? "100%" : lg ? "100%" : "1200px",
        }}
        px={screen === Screen.trade ? 0 : lg ? 0 : 12}
      >
        {screen === Screen.trade && (
          <div
            style={{
              background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)",
              height: "100vh",
              width: "100%",
              marginTop: "-12px",
            }}
          >
            <TradePage launch={current_launch} />
          </div>
        )}

        {screen === Screen.table && (
          <AMMTable
            ammList={amm_launches}
            setCurrentLaunch={setCurrentLaunch}
            setSelected={setSelected}
          />
        )}
      </HStack>
    </main>
  );
};

function BonkAThon() {
  

  return (
   
          <ViewAMMs />
   );
}


export default BonkAThon;

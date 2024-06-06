import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  DEV_RPC_NODE,
  MintData,
  bignum_to_num,
  request_raw_account_data,
  request_token_amount,
  request_token_supply,
  setMintData,
  uInt32ToLEBytes,
} from "../blog/apps/common";
import { TimeSeriesData, AMMData, PROGRAM, AMMLaunch } from "./state";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  Mint,
  getTransferFeeConfig,
  calculateFee,
  unpackMint,
  unpackAccount,
  AccountLayout,
  ACCOUNT_SIZE,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import {
  HStack,
  VStack,
  Text,
  Box,
  Tooltip,
  Link,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Select,
  Card,
  CardBody,
  Divider,
  Center,
} from "@chakra-ui/react";
import Image from "next/image";
import { MdOutlineContentCopy } from "react-icons/md";
import { PiArrowsOutLineVerticalLight } from "react-icons/pi";
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";
import { FaChartLine, FaInfo, FaPowerOff } from "react-icons/fa";

import { IoMdSwap } from "react-icons/io";
import { set } from "@metaplex-foundation/beet";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import {
  AssetV1,
  Key,
  getAssetV1GpaBuilder,
  updateAuthority,
} from "@metaplex-foundation/mpl-core";

import useResponsive from "../../hooks/useResponsive";
import useExitShort from "../blog/apps/shorts/hooks/useExitShort.";
import trimAddress from "../blog/apps/utils/trimAddress";
import WoodenButton from "../blog/apps/utils/woodenButton";
import { ShowExtensions } from "../blog/apps/utils/extensions";
import { getSolscanLink } from "../blog/apps/utils/getSolscanLink";
import UseWalletConnection from "../blog/apps/commonHooks/useWallet";
import useEnterShort from "../blog/apps/shorts/hooks/useEnterShort";
import usePlaceMarketOrder from "../blog/apps/shorts/hooks/usePlaceMarketOrder";
import useUpdateLiquidity from "../blog/apps/shorts/hooks/useUpdateCookLiquidity";
import {
  DEV_WSS_NODE,
  OptionData,
  default_option_data,
} from "../blog/apps/options/state";
import { OptionsPanel } from "./optionsPanel";
interface MarketData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TradePage = ({ launch }: { launch: AMMLaunch }) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const { xs, sm, lg } = useResponsive();

  const [leftPanel, setLeftPanel] = useState("Info");

  const [additionalPixels, setAdditionalPixels] = useState(0);

  const [selectedTab, setSelectedTab] = useState("Options");

  const handleClick = (tab: string) => {
    setSelectedTab(tab);
  };

  const [mobilePageContent, setMobilePageContent] = useState("Chart");

  const [market_data, setMarketData] = useState<MarketData[]>([]);
  const [daily_data, setDailyData] = useState<MarketData[]>([]);

  const [last_day_volume, setLastDayVolume] = useState<number>(0);

  const [base_address, setBaseAddress] = useState<PublicKey | null>(null);
  const [quote_address, setQuoteAddress] = useState<PublicKey | null>(null);
  const [price_address, setPriceAddress] = useState<PublicKey | null>(null);
  const [user_base_address, setUserBaseAddress] = useState<PublicKey | null>(
    null
  );
  const [user_quote_address, setUserQuoteAddress] = useState<PublicKey | null>(
    null
  );
  const [user_lp_address, setUserLPAddress] = useState<PublicKey | null>(null);
  const [amm_lp_amount, setLPAmount] = useState<number | null>(null);

  const [user_sol_amount, setUserSOLAmount] = useState<number>(0);
  const [user_base_amount, setUserBaseAmount] = useState<number>(0);
  const [user_quote_amount, setUserQuoteAmount] = useState<number>(0);
  const [user_lp_amount, setUserLPAmount] = useState<number>(0);

  const [total_supply, setTotalSupply] = useState<number>(0);

  const [amm, setAMM] = useState<AMMLaunch | null>(null);
  const [base_data, setBaseData] = useState<MintData | null>(null);
  const [quote_data, setQuoteData] = useState<MintData | null>(null);
  const [owned_assets, setOwnedAssets] = useState<AssetV1[]>([]);

  const price_ws_id = useRef<number | null>(null);
  const user_sol_token_ws_id = useRef<number | null>(null);
  const user_base_token_ws_id = useRef<number | null>(null);
  const user_quote_token_ws_id = useRef<number | null>(null);
  const user_lp_token_ws_id = useRef<number | null>(null);
  const check_market_data = useRef<boolean>(true);

  const check_nft_balance = useCallback(async () => {
    if (launch === null || wallet === null || wallet.publicKey === null) return;

    console.log("CHECKING NFT BALANCE");

    const umi = createUmi(DEV_RPC_NODE, "confirmed");

    let amm_seed_keys = [];
    if (
      launch.base.mint.address.toString() < launch.quote.mint.address.toString()
    ) {
      amm_seed_keys.push(launch.base.mint.address);
      amm_seed_keys.push(launch.quote.mint.address);
    } else {
      amm_seed_keys.push(launch.quote.mint.address);
      amm_seed_keys.push(launch.base.mint.address);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
      [
        amm_seed_keys[0].toBytes(),
        amm_seed_keys[1].toBytes(),
        Buffer.from("AMM"),
      ],
      PROGRAM
    )[0];

    let collection_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), Buffer.from("Collection")],
      PROGRAM
    )[0];

    let collection_umiKey = publicKey(collection_account.toString());

    const assets = await getAssetV1GpaBuilder(umi)
      .whereField("key", Key.AssetV1)
      .whereField(
        "updateAuthority",
        updateAuthority("Collection", [collection_umiKey])
      )
      .getDeserialized();

    console.log("assets", assets);
    let owned_assets = [];
    for (let i = 0; i < assets.length; i++) {
      if (assets[i].owner.toString() === wallet.publicKey.toString()) {
        owned_assets.push(assets[i]);
      }
    }
    console.log("have ", owned_assets.length, "addresses with balance");
    console.log(owned_assets);
    setOwnedAssets(owned_assets);
  }, [launch, wallet]);

  useEffect(() => {
    if (launch === null || wallet === null || wallet.publicKey === null) return;

    check_nft_balance();
  }, [launch, check_nft_balance, wallet]);

  const check_price_update = useCallback(async (result: any) => {
    //console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    const [price_data] = TimeSeriesData.struct.deserialize(event_data);
    //console.log("updated price data", price_data);

    let data: MarketData[] = [];

    for (let i = 0; i < price_data.data.length; i++) {
      let item = price_data.data[i];
      let time = bignum_to_num(item.timestamp) * 60;

      let open = Buffer.from(item.open).readFloatLE(0);
      let high = Buffer.from(item.high).readFloatLE(0);
      let low = Buffer.from(item.low).readFloatLE(0);
      let close = Buffer.from(item.close).readFloatLE(0);
      let volume = Buffer.from(item.volume).readFloatLE(0);

      data.push({
        time: time as UTCTimestamp,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
      });
      //console.log("new data", data);
    }
    setMarketData(data);
  }, []);

  const check_user_base_update = useCallback(async (result: any) => {
    //console.log("base update:", result);
    // if we have a subscription field check against ws_id

    let token_account = AccountLayout.decode(
      result.data.slice(0, ACCOUNT_SIZE)
    );
    let amount = bignum_to_num(token_account.amount);
    // console.log("update quote amount", amount);

    setUserBaseAmount(amount);
  }, []);

  const check_user_quote_update = useCallback(async (result: any) => {
    //console.log("quote update", user_quote_address.toString());
    // if we have a subscription field check against ws_id

    try {
      let token_account = AccountLayout.decode(
        result.data.slice(0, ACCOUNT_SIZE)
      );
      let amount = bignum_to_num(token_account.amount);
      //console.log("update quote amount", token_account);

      setUserQuoteAmount(amount);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const check_user_lp_update = useCallback(async (result: any) => {
    //console.log("lp update", result);
    // if we have a subscription field check against ws_id

    let token_account = AccountLayout.decode(
      result.data.slice(0, ACCOUNT_SIZE)
    );
    let amount = bignum_to_num(token_account.amount);

    setUserLPAmount(amount);
  }, []);

  // launch account subscription handler
  useEffect(() => {
    if (price_ws_id.current === null && price_address !== null) {
      price_ws_id.current = connection.onAccountChange(
        price_address,
        check_price_update,
        "confirmed"
      );
    }

    if (user_base_token_ws_id.current === null && user_base_address !== null) {
      user_base_token_ws_id.current = connection.onAccountChange(
        user_base_address,
        check_user_base_update,
        "confirmed"
      );
    }
    if (
      user_quote_token_ws_id.current === null &&
      user_quote_address !== null
    ) {
      user_quote_token_ws_id.current = connection.onAccountChange(
        user_quote_address,
        check_user_quote_update,
        "confirmed"
      );
    }
    if (user_lp_token_ws_id.current === null && user_lp_address !== null) {
      user_lp_token_ws_id.current = connection.onAccountChange(
        user_lp_address,
        check_user_lp_update,
        "confirmed"
      );
    }
  }, [
    connection,
    base_address,
    quote_address,
    price_address,
    user_base_address,
    user_quote_address,
    user_lp_address,
    check_price_update,
    check_user_base_update,
    check_user_quote_update,
    check_user_lp_update,
  ]);

  const CheckMarketData = useCallback(async () => {
    if (launch === null) {
      return;
    }

    if (amm === null) {
      setAMM(launch);
      return;
    }
    //("check market data");
    if (check_market_data.current === false) return;

    const base_mint = amm.amm_data.base_mint;
    const quote_mint = amm.amm_data.quote_mint;

    let amm_seed_keys = [];
    if (base_mint.toString() < quote_mint.toString()) {
      amm_seed_keys.push(base_mint);
      amm_seed_keys.push(quote_mint);
    } else {
      amm_seed_keys.push(quote_mint);
      amm_seed_keys.push(base_mint);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
      [
        amm_seed_keys[0].toBytes(),
        amm_seed_keys[1].toBytes(),
        Buffer.from("AMM"),
      ],
      PROGRAM
    )[0];

    let base_amm_account = amm.amm_data.base_key;
    let quote_amm_account = amm.amm_data.quote_key;
    let lp_mint = amm.amm_data.lp_mint;

    console.log(amm);
    let baseMintData = amm.base;
    let quoteMintData = amm.quote;

    setBaseData(baseMintData);
    setQuoteData(quoteMintData);

    console.log("base key", base_amm_account.toString());

    let user_base_token_account_key = await getAssociatedTokenAddress(
      base_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      baseMintData.token_program
    );

    let user_quote_token_account_key = await getAssociatedTokenAddress(
      quote_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      quoteMintData.token_program
    );

    let user_lp_token_account_key = await getAssociatedTokenAddress(
      lp_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      baseMintData.token_program
    );
    // console.log(base_amm_account.toString(), quote_amm_account.toString());

    setBaseAddress(base_amm_account);
    setQuoteAddress(quote_amm_account);
    setUserBaseAddress(user_base_token_account_key);
    setUserQuoteAddress(user_quote_token_account_key);
    setUserLPAddress(user_lp_token_account_key);

    let base_amount = amm.amm_data.amm_base_amount;
    let quote_amount = amm.amm_data.amm_quote_amount;
    let user_base_amount = await request_token_amount(
      user_base_token_account_key
    );
    let user_quote_amount = await request_token_amount(
      user_quote_token_account_key
    );
    let user_lp_amount = await request_token_amount(user_lp_token_account_key);

    console.log(
      "user amounts",
      user_base_amount,
      user_lp_amount,
      base_amount,
      quote_amount
    );
    setUserBaseAmount(user_base_amount);
    setUserLPAmount(user_lp_amount);
    setUserQuoteAmount(user_quote_amount);

    let total_supply = await request_token_supply(base_mint);
    setTotalSupply(total_supply / Math.pow(10, baseMintData.mint.decimals));

    setLPAmount(amm.amm_data.lp_amount);

    let index_buffer = uInt32ToLEBytes(0);
    let price_data_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
      PROGRAM
    )[0];

    setPriceAddress(price_data_account);

    let price_data_buffer = await request_raw_account_data(price_data_account);
    const [price_data] = TimeSeriesData.struct.deserialize(price_data_buffer);

    console.log(price_data.data);
    let data: MarketData[] = [];
    let daily_data: MarketData[] = [];

    let now = new Date().getTime() / 1000;
    let last_volume = 0;

    let last_date = -1;
    let last_time = -1;
    for (let i = 0; i < price_data.data.length; i++) {
      let item = price_data.data[i];
      let time = bignum_to_num(item.timestamp) * 60;
      let date = Math.floor(time / 24 / 60 / 60) * 24 * 60 * 60;

      if (time < last_time) {
        continue;
      }
      last_time = time;
      let open = Buffer.from(item.open).readFloatLE(0);
      let high = Buffer.from(item.high).readFloatLE(0);
      let low = Buffer.from(item.low).readFloatLE(0);
      let close = Buffer.from(item.close).readFloatLE(0);
      let volume = Buffer.from(item.volume).readFloatLE(0);

      console.log(time, new Date(time * 1000), close);

      if (now - time < 24 * 60 * 60) {
        last_volume += volume;
      }

      data.push({
        time: time as UTCTimestamp,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: volume,
      });

      if (date !== last_date) {
        daily_data.push({
          time: date as UTCTimestamp,
          open: open,
          high: high,
          low: low,
          close: close,
          volume: volume,
        });
        last_date = date;
      } else {
        daily_data[daily_data.length - 1].high =
          high > daily_data[daily_data.length - 1].high
            ? high
            : daily_data[daily_data.length - 1].high;
        daily_data[daily_data.length - 1].low =
          low < daily_data[daily_data.length - 1].low
            ? low
            : daily_data[daily_data.length - 1].low;
        daily_data[daily_data.length - 1].close = close;
        daily_data[daily_data.length - 1].volume += volume;
      }
    }
    setMarketData(data);
    setDailyData(daily_data);
    setLastDayVolume(last_volume);
    check_market_data.current = false;
  }, [amm, wallet.publicKey, launch]);

  useEffect(() => {
    CheckMarketData();
  }, [CheckMarketData]);

  const handleMouseDown = () => {
    document.addEventListener("mousemove", handleMouseMove);

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", handleMouseMove);
    });
  };

  const handleMouseMove = (event) => {
    setAdditionalPixels((prevPixels) => prevPixels + event.movementY);
  };

  if (amm === null || base_data === null) {
    return (
      <Head>
        <title>Trade</title>
      </Head>
    );
  }

  const Details = () => {
    return (
      <HStack
        spacing={5}
        w="100%"
        px={5}
        pb={sm ? 5 : 0}
        style={{
          borderBottom: sm ? "0.5px solid rgba(134, 142, 150, 0.5)" : "",
        }}
      >
        <Image
          alt="Launch icon"
          src={base_data.icon}
          width={65}
          height={65}
          style={{ borderRadius: "8px", backgroundSize: "cover" }}
        />
        <VStack align="start" spacing={1}>
          <Text
            m={0}
            fontSize={20}
            color="white"
            className="font-face-kg"
            style={{ wordBreak: "break-all" }}
            align={"center"}
          >
            {base_data.symbol}
          </Text>
          <HStack spacing={3} align="start" justify="start">
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"large"}
            >
              {trimAddress(amm.amm_data.base_mint.toString())}
            </Text>

            <Tooltip
              label="Copy Contract Address"
              hasArrow
              fontSize="large"
              offset={[0, 10]}
            >
              <div
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(
                    amm.amm_data.base_mint.toString()
                  );
                }}
              >
                <MdOutlineContentCopy color="white" size={25} />
              </div>
            </Tooltip>

            <Tooltip
              label="View in explorer"
              hasArrow
              fontSize="large"
              offset={[0, 10]}
            >
              <Link
                href={getSolscanLink(amm.amm_data.base_mint.toString())}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src="/images/solscan.png"
                  width={25}
                  height={25}
                  alt="Solscan icon"
                />
              </Link>
            </Tooltip>
          </HStack>
        </VStack>
      </HStack>
    );
  };

  return (
    <>
      <HStack w="full" h="full" spacing={0} align="start" pb={sm ? 14 : 0}>
        {(!sm ||
          (sm &&
            (mobilePageContent === "Info" ||
              mobilePageContent === "Trade"))) && (
          <VStack
            py={5}
            align="start"
            w={sm ? "100%" : 320}
            h="100%"
            style={{
              minWidth: "360px",
              borderRight: "0.5px solid rgba(134, 142, 150, 0.5)",
            }}
            spacing={8}
          >
            <Details />

            {!sm && (
              <Box
                px={5}
                mt={-2}
                pb={5}
                width="100%"
                style={{ borderBottom: "1px solid rgba(134, 142, 150, 0.5)" }}
              >
                <HStack>
                  <WoodenButton
                    action={() => setLeftPanel("Info")}
                    label={"Info"}
                    size={15}
                    width="100%"
                  />
                  <WoodenButton
                    action={() => {
                      setLeftPanel("LP");
                    }}
                    label={"LP"}
                    size={15}
                    width="100%"
                  />
                  <WoodenButton
                    action={() => {
                      setLeftPanel("Trade");
                    }}
                    label={"Options"}
                    size={15}
                    width="100%"
                  />

                  <WoodenButton
                    action={() => {
                      setLeftPanel("Shorts");
                    }}
                    label={"Shorts"}
                    size={15}
                    width="100%"
                  />
                </HStack>
              </Box>
            )}

            {leftPanel === "Info" && (
              <InfoContent
                amm={amm.amm_data}
                base_data={base_data}
                quote_data={quote_data}
                volume={last_day_volume}
                price={
                  market_data.length > 0
                    ? market_data[market_data.length - 1].close
                    : 0
                }
                total_supply={
                  bignum_to_num(amm.amm_data.amm_base_amount) /
                  Math.pow(10, amm.base.mint.decimals)
                }
                quote_amount={bignum_to_num(amm.amm_data.amm_quote_amount)}
              />
            )}

            {(leftPanel === "Trade" ||
              leftPanel === "LP" ||
              leftPanel === "Shorts") && (
              <BuyAndSell
                default_selected={leftPanel === "Trade" ? "Buy" : "LP+"}
                left_panel={leftPanel}
                base_data={base_data}
                quote_data={quote_data}
                amm={amm.amm_data}
                amm_lp_balance={amm_lp_amount}
                user_base_balance={user_base_amount}
                user_quote_balance={user_quote_amount}
                user_lp_balance={user_lp_amount}
                owned_assets={owned_assets}
              />
            )}
          </VStack>
        )}

        {(!sm || (sm && mobilePageContent === "Chart")) && (
          <VStack
            align="start"
            justify="start"
            w="100%"
            spacing={0}
            style={{
              minHeight: "100vh",
              overflow: "auto",
            }}
          >
            <ChartComponent
              data={market_data}
              additionalPixels={additionalPixels}
            />

            <div
              style={{
                width: "100%",
                height: "10px",
                cursor: "ns-resize",
                position: "relative",
              }}
              onMouseDown={handleMouseDown}
            >
              <PiArrowsOutLineVerticalLight
                size={26}
                style={{
                  position: "absolute",
                  color: "white",
                  margin: "auto",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  opacity: 0.75,
                  zIndex: 99,
                }}
              />
            </div>

            <HStack
              align="center"
              w="100%"
              px={4}
              style={{
                height: "55px",
                borderTop: "1px solid rgba(134, 142, 150, 0.5)",
              }}
            >
              <HStack spacing={3}>
                {["Options", "Shorts"].map((name, i) => {
                  const isActive = selectedTab === name;

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
                        handleClick(name);
                      }}
                      px={4}
                      py={2}
                      mt={-2}
                      w={"fit-content"}
                      justify="center"
                    >
                      <Text
                        m={"0 auto"}
                        fontSize="medium"
                        fontWeight="semibold"
                      >
                        {name}
                      </Text>
                    </HStack>
                  );
                })}
              </HStack>
            </HStack>

            {/* {selectedTab === "Options" && wallet.connected && (
              <OptionsTable
                is_2022={is_token_2022}
                mint={token}
                collection={collection}
                optionsList={collection_assets}
                mode={0}
                update={checkCollection}
              />
            )} */}

            {/* {selectedTab === "Shorts" && wallet.connected && <ShortsTable />} */}
          </VStack>
        )}
      </HStack>

      {sm && (
        <HStack
          bg="url(/images/footer_fill.jpeg)"
          bgSize="cover"
          boxShadow="0px 3px 13px 13px rgba(0, 0, 0, 0.55)"
          position="fixed"
          bottom={0}
          h={16}
          w="100%"
          gap={2}
          justify="space-around"
        >
          <VStack
            spacing={0.5}
            w="120px"
            onClick={() => {
              setMobilePageContent("Chart");
            }}
          >
            <FaChartLine size={24} color={"#683309"} />
            <Text
              mb={0}
              color={"#683309"}
              fontSize="medium"
              fontFamily="ReemKufiRegular"
              fontWeight="bold"
            >
              Chart
            </Text>
          </VStack>

          <VStack
            w="120px"
            onClick={() => {
              setMobilePageContent("Trade");
              setLeftPanel("Trade");
            }}
          >
            <IoMdSwap size={28} color={"#683309"} />
            <Text
              mb={0}
              mt={-2}
              color={"#683309"}
              fontSize="medium"
              fontFamily="ReemKufiRegular"
              fontWeight="bold"
            >
              Buy/Sell
            </Text>
          </VStack>

          <VStack
            w="120px"
            onClick={() => {
              setMobilePageContent("Info");
              setLeftPanel("Info");
            }}
          >
            <FaInfo size={24} color={"#683309"} />
            <Text
              mb={0}
              color={"#683309"}
              fontSize="medium"
              fontFamily="ReemKufiRegular"
              fontWeight="bold"
            >
              Info
            </Text>
          </VStack>
        </HStack>
      )}
    </>
  );
};

function getAttributes(option: AssetV1) {
  let attributes_map: Map<string, string> = new Map<string, string>();
  let attributes = option.attributes.attributeList;

  for (let i = 0; i < attributes.length; i++) {
    attributes_map.set(attributes[i].key, attributes[i].value);
  }

  return attributes_map;
}

function formatPrice(price: number, decimals: number) {
  let priceString =
    price <= 1e-3 ? price.toExponential(3) : price.toFixed(decimals);

  return priceString;
}

const ShortCard = ({
  asset,
  amm,
  base_mint,
  quote_mint,
}: {
  asset: AssetV1;
  amm: AMMData;
  base_mint: MintData;
  quote_mint: MintData;
}) => {
  const wallet = useWallet();
  const { handleConnectWallet } = UseWalletConnection();
  const { ExitShort, isLoading: exitShortLoading } = useExitShort();

  let base_balance = bignum_to_num(amm.amm_base_amount);
  let quote_balance = bignum_to_num(amm.amm_quote_amount);

  let attributes = getAttributes(asset);
  let base_input = parseFloat(attributes.get("short_base_amount"));
  let quote_input = parseFloat(attributes.get("short_quote_amount"));
  let deposit = parseFloat(attributes.get("deposit_amount"));
  let short_price = parseFloat(attributes.get("short_price"));
  let start_time = parseFloat(attributes.get("start_time"));
  let liquidation_price = parseFloat(attributes.get("liquidation_price"));

  let quote_output = (base_input * quote_balance) / (base_balance - base_input);

  let quote_post_fees = quote_output / (1 - amm.fee / 100 / 100);

  console.log("short", attributes, base_input, quote_input, quote_post_fees);

  let current_price =
    quote_post_fees /
    Math.pow(10, quote_mint.mint.decimals) /
    (base_input / Math.pow(10, base_mint.mint.decimals));

  let current_time = new Date().getTime() / 1000;
  let time_delta_years = (current_time - start_time) / 60 / 60 / 24 / 365;
  let borrow_fee =
    Math.floor(time_delta_years * quote_input * (amm.borrow_cost / 100) + 1) /
    Math.pow(10, quote_mint.mint.decimals);
  let profit =
    (quote_input - quote_post_fees) / Math.pow(10, quote_mint.mint.decimals) -
    borrow_fee;

  return (
    <>
      <VStack align="left">
        <Text m="0" color="white">
          Base {base_input}
        </Text>
        <Text m="0" color="white">
          Quote {quote_input}
        </Text>

        <Text m="0" color="white">
          Short Price {formatPrice(short_price, quote_mint.mint.decimals)}
        </Text>
        <Text m="0" color="white">
          Liq Price {formatPrice(liquidation_price, quote_mint.mint.decimals)}
        </Text>

        <Text m="0" color="white">
          Current Price {formatPrice(current_price, quote_mint.mint.decimals)}
        </Text>
        <Text m="0" color="white">
          Borrow Fee {formatPrice(borrow_fee, quote_mint.mint.decimals)}
        </Text>
        <Text m="0" color="white">
          PnL {formatPrice(profit, quote_mint.mint.decimals)}
        </Text>
        <Button
          mt={2}
          size="lg"
          w="100%"
          px={4}
          py={2}
          bg={"#83FF81"}
          isLoading={exitShortLoading}
          onClick={() => {
            !wallet.connected ? handleConnectWallet() : ExitShort(amm, asset);
          }}
        >
          <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
            {!wallet.connected ? "Connect Wallet" : "Exit"}
          </Text>
        </Button>
      </VStack>
    </>
  );
};

const BuyAndSell = ({
  left_panel,
  default_selected,
  base_data,
  quote_data,
  amm,
  amm_lp_balance,
  user_base_balance,
  user_quote_balance,
  user_lp_balance,
  owned_assets,
}: {
  left_panel: String;
  default_selected: String;
  base_data: MintData;
  quote_data: MintData;
  amm: AMMData;
  amm_lp_balance: number;
  user_base_balance: number;
  user_quote_balance: number;
  user_lp_balance: number;
  owned_assets: AssetV1[];
}) => {
  const { xs } = useResponsive();
  const wallet = useWallet();
  const { handleConnectWallet } = UseWalletConnection();
  const [selected, setSelected] = useState(default_selected);
  const [token_amount, setTokenAmount] = useState<number>(0);
  const [sol_amount, setSOLAmount] = useState<number>(0);
  const [order_type, setOrderType] = useState<number>(0);
  const [short_amount, setShortAmount] = useState<number>(0);
  const [deposit_amount, setDepositAmount] = useState<number>(0);
  const option_data = useRef<OptionData>(default_option_data);
  const [solBalance, setSOLBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [is_token_2022, setTokenOwner] = useState<boolean>(false);

  const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder();
  const { EnterShort, isLoading: enterShortLoading } = useEnterShort();

  const { UpdateLiquidity, isLoading: updateLiquidityLoading } =
    useUpdateLiquidity();

  const handleClick = (tab: string) => {
    setSelected(tab);

    if (tab == "Buy") setOrderType(0);
    if (tab == "Sell") setOrderType(1);
  };

  let base_balance = bignum_to_num(amm.amm_base_amount);
  let quote_balance = bignum_to_num(amm.amm_quote_amount);

  let base_raw = Math.floor(
    token_amount * Math.pow(10, base_data.mint.decimals)
  );
  let total_base_fee = 0;
  let transfer_fee = 0;
  let max_transfer_fee = 0;
  let transfer_fee_config = getTransferFeeConfig(base_data.mint);
  if (transfer_fee_config !== null) {
    transfer_fee = transfer_fee_config.newerTransferFee.transferFeeBasisPoints;
    max_transfer_fee =
      Number(transfer_fee_config.newerTransferFee.maximumFee) /
      Math.pow(10, base_data.mint.decimals);
    total_base_fee += Number(
      calculateFee(transfer_fee_config.newerTransferFee, BigInt(base_raw))
    );
  }

  let amm_base_fee =
    selected == "Buy" || selected == "Sell"
      ? Math.ceil(((base_raw - total_base_fee) * amm.fee) / 100 / 100)
      : 0;
  total_base_fee += amm_base_fee;

  let base_input_amount = base_raw - total_base_fee;

  let quote_output =
    (base_input_amount * quote_balance) /
    (base_input_amount + base_balance) /
    Math.pow(10, quote_data.mint.decimals);

  //console.log("base in/out", base_input_amount / Math.pow(10, launch.decimals), quote_output)

  let quote_raw = Math.floor(
    sol_amount * Math.pow(10, quote_data.mint.decimals)
  );
  let amm_quote_fee = Math.ceil((quote_raw * amm.fee) / 100 / 100);
  let quote_input_amount = quote_raw - amm_quote_fee;

  console.log(
    quote_input_amount,
    base_balance,
    quote_balance,
    quote_input_amount
  );
  let base_output =
    (quote_input_amount * base_balance) /
    (quote_balance + quote_input_amount) /
    Math.pow(10, base_data.mint.decimals);

  let price =
    quote_balance /
    Math.pow(10, quote_data.mint.decimals) /
    (base_balance / Math.pow(10, base_data.mint.decimals));

  let base_no_slip = sol_amount / price;
  let quote_no_slip = token_amount * price;

  let max_sol_amount = Math.floor(
    quote_no_slip * Math.pow(10, quote_data.mint.decimals) * 2
  );

  let slippage =
    order_type == 0
      ? base_no_slip / base_output - 1
      : quote_no_slip / quote_output - 1;

  let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);

  let quote_output_string =
    quote_output <= 1e-3
      ? quote_output.toExponential(3)
      : quote_output.toFixed(5);
  quote_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

  let base_output_string =
    base_output === 0
      ? "0"
      : base_output <= 1e-3
        ? base_output.toExponential(3)
        : base_output.toLocaleString("en-US", {
            minimumFractionDigits: base_data.mint.decimals,
            maximumFractionDigits: base_data.mint.decimals,
          });

  base_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

  let lp_generated =
    (base_raw * (amm_lp_balance / base_balance)) /
    Math.pow(10, base_data.mint.decimals);

  let lp_quote_output =
    (quote_balance * base_raw) /
    amm_lp_balance /
    Math.pow(10, quote_data.mint.decimals);
  let lp_base_output =
    (base_balance * base_raw) /
    amm_lp_balance /
    Math.pow(10, base_data.mint.decimals);
  if (selected === "LP-") {
    quote_output_string =
      lp_quote_output <= 1e-3
        ? lp_quote_output.toExponential(3)
        : lp_quote_output.toFixed(5);
    base_output_string =
      lp_base_output <= 1e-3
        ? lp_base_output.toExponential(3)
        : lp_base_output.toFixed(base_data.mint.decimals);
  }

  let short_base_amount =
    short_amount *
    (1 - amm.fee / 100 / 100) *
    Math.pow(10, base_data.mint.decimals);
  let short_quote_output =
    (short_base_amount * quote_balance) /
    (short_base_amount + base_balance) /
    Math.pow(10, quote_data.mint.decimals);

  let deposit_per_token = deposit_amount / short_amount;
  let liquidation_price =
    deposit_amount > 0
      ? deposit_per_token + short_quote_output / short_amount
      : short_quote_output / short_amount;
  let liquidation_price_string =
    liquidation_price <= 1e-3
      ? liquidation_price.toExponential(3)
      : liquidation_price.toFixed(quote_data.mint.decimals);

  //console.log("quote: ", user_quote_balance);

  let options = useMemo(
    () => {
      return []; // replace this with your actual logic to generate options
    },
    [
      /* dependencies that affect options */
    ]
  );
  if (left_panel === "Trade") {
    options = ["Buy", "Sell"];
  }
  if (left_panel === "LP") {
    options = ["LP+", "LP-"];
  }
  if (left_panel === "Shorts") {
    options = ["Enter", "Exit"];
  }

  useEffect(() => {
    setSelected(options[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left_panel]);

  const fetchData = useCallback(async () => {
    if (base_data.mint === null) return;

    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });

    let user_token_account = getAssociatedTokenAddressSync(
      base_data.mint.address, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      is_token_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
    );

    let user_balance = await connection.getBalance(
      wallet.publicKey,
      "confirmed"
    );
    let token_balance = 0;

    try {
      let response = await connection.getTokenAccountBalance(
        user_token_account,
        "confirmed"
      );
      token_balance =
        parseFloat(response.value.amount) /
        Math.pow(10, response.value.decimals);
    } catch (error) {
      console.log(error);
    }

    console.log("user balance", user_balance / LAMPORTS_PER_SOL, token_balance);

    setSOLBalance(user_balance / LAMPORTS_PER_SOL);
    setTokenBalance(token_balance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, base_data.mint, is_token_2022]);

  useEffect(() => {
    if (base_data.mint === null) return;

    fetchData();
  }, [base_data.mint, fetchData]);

  return (
    <VStack align="start" w="100%" mt={-2} spacing={4}>
      {left_panel === "Trade" ? (
        <VStack align="start" px={5} w="100%" mt={-2} spacing={4}>
          <OptionsPanel
            mint_data={base_data.mint}
            is_2022={is_token_2022}
            token_balance={tokenBalance}
            sol_balance={solBalance}
            icon={base_data.icon}
            uri={base_data.uri}
            symbol={base_data.symbol}
          />
        </VStack>
      ) : (
        <VStack align="start" px={5} w="100%" mt={-2} spacing={4}>
          <HStack align="center" spacing={0} zIndex={99} w="100%">
            {options.map((name, i) => {
              const isActive = selected === name;

              const baseStyle = {
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              };

              const activeStyle = {
                background: isActive ? "#edf2f7" : "transparent",
                color: isActive ? "black" : "white",
                borderRadius: isActive ? "6px" : "",
                border: isActive ? "none" : "",
              };

              return (
                <Button
                  key={i}
                  style={{
                    ...baseStyle,
                    ...activeStyle,
                  }}
                  onClick={() => {
                    handleClick(name);
                  }}
                  w={"50%"}
                >
                  {name}
                </Button>
              );
            })}
          </HStack>

          <HStack justify="space-between" w="100%" mt={2}>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Available Balance:
            </Text>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
            >
              {selected === "Buy"
                ? (
                    user_quote_balance / Math.pow(10, quote_data.mint.decimals)
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })
                : selected === "LP-"
                  ? (
                      user_lp_balance / Math.pow(10, base_data.mint.decimals)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : (
                      user_base_balance / Math.pow(10, base_data.mint.decimals)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
              {selected === "Buy"
                ? quote_data.symbol
                : selected === "LP-"
                  ? "LP"
                  : base_data.symbol}
            </Text>
          </HStack>

          <HStack justify="space-between" w="100%" mt={2}>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              AMM Fee (bps):
            </Text>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
            >
              {amm.fee}
            </Text>
          </HStack>

          <HStack justify="space-between" w="100%" mt={2}>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Transfer Fee (bps):
            </Text>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
            >
              {transfer_fee}
            </Text>
          </HStack>

          <HStack justify="space-between" w="100%" mt={2}>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Max Transfer Fee ({base_data.symbol}):
            </Text>
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
            >
              {max_transfer_fee}
            </Text>
          </HStack>

          <VStack align="start" w="100%">
            <HStack w="100%" justify="space-between">
              {selected === "LP+" ? (
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  Add:
                </Text>
              ) : selected == "LP-" ? (
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  Remove:
                </Text>
              ) : selected == "Enter" ? (
                <>
                  <Text
                    m={0}
                    color={"white"}
                    fontFamily="ReemKufiRegular"
                    fontSize={"medium"}
                    opacity={0.5}
                  >
                    Short:
                  </Text>
                </>
              ) : selected !== "Exit" ? (
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  Swap:
                </Text>
              ) : (
                <></>
              )}

              {selected !== "Enter" && selected !== "Exit" && (
                <HStack spacing={2}>
                  <Text
                    m={0}
                    color={"white"}
                    fontFamily="ReemKufiRegular"
                    fontSize={"medium"}
                    opacity={0.5}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (selected === "Buy") {
                        setSOLAmount(
                          user_quote_balance /
                            Math.pow(10, quote_data.mint.decimals) /
                            2
                        );
                      }

                      if (selected === "Sell") {
                        setTokenAmount(
                          user_base_balance /
                            Math.pow(10, base_data.mint.decimals) /
                            2
                        );
                      }
                    }}
                  >
                    Half
                  </Text>
                  <Center height="15px">
                    <Divider orientation="vertical" opacity={0.25} />
                  </Center>
                  <Text
                    m={0}
                    color={"white"}
                    fontFamily="ReemKufiRegular"
                    fontSize={"medium"}
                    opacity={0.5}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (selected === "Buy") {
                        setSOLAmount(
                          user_quote_balance /
                            Math.pow(10, quote_data.mint.decimals)
                        );
                      }

                      if (selected === "Sell") {
                        setTokenAmount(
                          user_base_balance /
                            Math.pow(10, base_data.mint.decimals)
                        );
                      }
                    }}
                  >
                    Max
                  </Text>
                </HStack>
              )}
            </HStack>

            {selected === "Buy" ? (
              <InputGroup size="md">
                <Input
                  color="white"
                  size="lg"
                  borderColor="rgba(134, 142, 150, 0.5)"
                  value={sol_amount}
                  onChange={(e) => {
                    setSOLAmount(
                      !isNaN(parseFloat(e.target.value)) ||
                        e.target.value === ""
                        ? parseFloat(e.target.value)
                        : sol_amount
                    );
                  }}
                  type="number"
                  min="0"
                />
                <InputRightElement h="100%" w={50}>
                  <Image
                    src={quote_data.icon}
                    width={30}
                    height={30}
                    alt="SOL Icon"
                    style={{ borderRadius: "100%" }}
                  />
                </InputRightElement>
              </InputGroup>
            ) : selected === "Enter" ? (
              <>
                <InputGroup size="md">
                  <Input
                    color="white"
                    size="lg"
                    borderColor="rgba(134, 142, 150, 0.5)"
                    value={short_amount}
                    onChange={(e) => {
                      setShortAmount(
                        !isNaN(parseFloat(e.target.value)) ||
                          e.target.value === ""
                          ? parseFloat(e.target.value)
                          : short_amount
                      );
                    }}
                    type="number"
                    min="0"
                  />
                  <InputRightElement h="100%" w={50}>
                    <Image
                      src={base_data.icon}
                      width={30}
                      height={30}
                      alt="SOL Icon"
                      style={{ borderRadius: "100%" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </>
            ) : selected !== "Exit" ? (
              <InputGroup size="md">
                <Input
                  color="white"
                  size="lg"
                  borderColor="rgba(134, 142, 150, 0.5)"
                  value={token_amount}
                  onChange={(e) => {
                    setTokenAmount(
                      !isNaN(parseFloat(e.target.value)) ||
                        e.target.value === ""
                        ? parseFloat(e.target.value)
                        : token_amount
                    );
                  }}
                  type="number"
                  min="0"
                />
                <InputRightElement h="100%" w={50}>
                  {selected !== "LP-" ? (
                    <Image
                      src={base_data.icon}
                      width={30}
                      height={30}
                      alt=""
                      style={{ borderRadius: "100%" }}
                    />
                  ) : (
                    <Text
                      m={0}
                      color={"white"}
                      fontFamily="ReemKufiRegular"
                      fontSize={"medium"}
                      opacity={0.5}
                    >
                      LP
                    </Text>
                  )}
                </InputRightElement>
              </InputGroup>
            ) : (
              <></>
            )}
          </VStack>

          {selected === "Exit" && (
            <>
              {owned_assets.map((asset, i) => (
                <ShortCard
                  key={i}
                  asset={asset}
                  amm={amm}
                  base_mint={base_data}
                  quote_mint={quote_data}
                />
              ))}
            </>
          )}

          {selected === "Enter" && (
            <>
              <VStack align="start" w="100%">
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  Deposit:
                </Text>
                <InputGroup size="md">
                  <Input
                    color="white"
                    size="lg"
                    borderColor="rgba(134, 142, 150, 0.5)"
                    value={deposit_amount}
                    onChange={(e) => {
                      setDepositAmount(
                        !isNaN(parseFloat(e.target.value)) ||
                          e.target.value === ""
                          ? parseFloat(e.target.value)
                          : deposit_amount
                      );
                    }}
                    type="number"
                    min="0"
                  />
                  <InputRightElement h="100%" w={50}>
                    <Image
                      src={quote_data.icon}
                      width={30}
                      height={30}
                      alt=""
                      style={{ borderRadius: "100%" }}
                    />
                  </InputRightElement>
                </InputGroup>
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  Liquidation Price:
                </Text>
                <InputGroup size="md">
                  <Input
                    readOnly={true}
                    color="white"
                    size="lg"
                    borderColor="rgba(134, 142, 150, 0.5)"
                    value={
                      liquidation_price_string === "NaN"
                        ? "0"
                        : liquidation_price_string
                    }
                    disabled
                  />
                  <InputRightElement h="100%" w={50}>
                    <Image
                      src={quote_data.icon}
                      width={30}
                      height={30}
                      alt=""
                      style={{ borderRadius: "100%" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </>
          )}

          <VStack align="start" w="100%">
            {selected === "LP+" ? (
              <Text
                m={0}
                color={"white"}
                fontFamily="ReemKufiRegular"
                fontSize={"medium"}
                opacity={0.5}
              >
                And:
              </Text>
            ) : selected === "Sell" ||
              selected === "LP+" ||
              selected === "LP-" ? (
              <Text
                m={0}
                color={"white"}
                fontFamily="ReemKufiRegular"
                fontSize={"medium"}
                opacity={0.5}
              >
                For:
              </Text>
            ) : (
              <></>
            )}
            {selected === "Buy" ? (
              <InputGroup size="md">
                <Input
                  readOnly={true}
                  color="white"
                  size="lg"
                  borderColor="rgba(134, 142, 150, 0.5)"
                  value={
                    base_output_string === "NaN" ? "0" : base_output_string
                  }
                  disabled
                />
                <InputRightElement h="100%" w={50}>
                  <Image
                    src={base_data.icon}
                    width={30}
                    height={30}
                    alt=""
                    style={{ borderRadius: "100%" }}
                  />
                </InputRightElement>
              </InputGroup>
            ) : selected === "Sell" ||
              selected === "LP+" ||
              selected === "LP-" ? (
              <InputGroup size="md">
                <Input
                  readOnly={true}
                  color="white"
                  size="lg"
                  borderColor="rgba(134, 142, 150, 0.5)"
                  value={
                    quote_output_string === "NaN" ? "0" : quote_output_string
                  }
                  disabled
                />
                <InputRightElement h="100%" w={50}>
                  <Image
                    src={quote_data.icon}
                    width={30}
                    height={30}
                    alt="SOL Icon"
                    style={{ borderRadius: "100%" }}
                  />
                </InputRightElement>
              </InputGroup>
            ) : (
              <></>
            )}
          </VStack>

          {selected === "LP+" && (
            <>
              <VStack align="start" w="100%">
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  For:
                </Text>

                <InputGroup size="md">
                  <Input
                    readOnly={true}
                    color="white"
                    size="lg"
                    borderColor="rgba(134, 142, 150, 0.5)"
                    value={lp_generated.toFixed(base_data.mint.decimals)}
                    disabled
                  />
                  <InputRightElement h="100%" w={50}>
                    <Text
                      m={0}
                      color={"white"}
                      fontFamily="ReemKufiRegular"
                      fontSize={"medium"}
                      opacity={0.5}
                    >
                      LP
                    </Text>
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </>
          )}

          {selected === "LP-" && (
            <>
              <VStack align="start" w="100%">
                <Text
                  m={0}
                  color={"white"}
                  fontFamily="ReemKufiRegular"
                  fontSize={"medium"}
                  opacity={0.5}
                >
                  And:
                </Text>

                <InputGroup size="md">
                  <Input
                    readOnly={true}
                    color="white"
                    size="lg"
                    borderColor="rgba(134, 142, 150, 0.5)"
                    value={base_output_string}
                    disabled
                  />
                  <InputRightElement h="100%" w={50}>
                    <Image
                      src={base_data.icon}
                      width={30}
                      height={30}
                      alt=""
                      style={{ borderRadius: "100%" }}
                    />
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </>
          )}

          {selected === "LP+" ? (
            <Button
              mt={2}
              size="lg"
              w="100%"
              px={4}
              py={2}
              bg={"#83FF81"}
              isLoading={updateLiquidityLoading}
              onClick={() => {
                !wallet.connected
                  ? handleConnectWallet()
                  : UpdateLiquidity(amm, token_amount, 0);
              }}
            >
              <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                {!wallet.connected ? "Connect Wallet" : "Add Liquidity"}
              </Text>
            </Button>
          ) : selected === "LP-" ? (
            <Button
              mt={2}
              size="lg"
              w="100%"
              px={4}
              py={2}
              bg={"#FF6E6E"}
              isLoading={updateLiquidityLoading}
              onClick={() => {
                !wallet.connected
                  ? handleConnectWallet()
                  : UpdateLiquidity(amm, token_amount, 1);
              }}
            >
              <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                {!wallet.connected ? "Connect Wallet" : "Remove Liquidity"}
              </Text>
            </Button>
          ) : selected === "Enter" ? (
            <>
              <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={"#83FF81"}
                isLoading={placingOrder}
                onClick={() => {
                  !wallet.connected
                    ? handleConnectWallet()
                    : EnterShort(amm, short_amount, deposit_amount);
                }}
              >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                  {!wallet.connected ? "Connect Wallet" : "Enter"}
                </Text>
              </Button>
            </>
          ) : selected !== "Exit" ? (
            <>
              <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={selected === "Buy" ? "#83FF81" : "#FF6E6E"}
                isLoading={placingOrder}
                onClick={() => {
                  !wallet.connected
                    ? handleConnectWallet()
                    : PlaceMarketOrder(
                        amm,
                        token_amount,
                        sol_amount,
                        order_type
                      );
                }}
              >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                  {!wallet.connected
                    ? "Connect Wallet"
                    : selected === "Buy"
                      ? "Buy"
                      : selected === "Sell"
                        ? "Sell"
                        : ""}
                </Text>
              </Button>
            </>
          ) : (
            <></>
          )}
        </VStack>
      )}
    </VStack>
  );
};

const InfoContent = ({
  amm,
  base_data,
  quote_data,
  price,
  quote_amount,
  volume,
  total_supply,
}: {
  amm: AMMData;
  base_data: MintData;
  quote_data: MintData;
  price: number;
  quote_amount: number;
  volume: number;
  total_supply: number;
}) => {
  console.log(quote_amount, total_supply, quote_amount / total_supply);
  return (
    <VStack spacing={8} w="100%" mb={3}>
      <HStack mt={-2} px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          PRICE:
        </Text>
        <HStack>
          <Text
            m={0}
            color={"white"}
            fontFamily="ReemKufiRegular"
            fontSize={"large"}
          >
            {price < 1e-3
              ? price.toExponential(3)
              : price.toFixed(Math.min(base_data.mint.decimals, 3))}
          </Text>
          <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" />
        </HStack>
      </HStack>

      <HStack mt={-2} px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          VOLUME (24h):
        </Text>
        <HStack>
          <Text
            m={0}
            color={"white"}
            fontFamily="ReemKufiRegular"
            fontSize={"large"}
          >
            {volume.toLocaleString()}
          </Text>
          <Image src={base_data.icon} width={30} height={30} alt="Token Icon" />
        </HStack>
      </HStack>

      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          SUPPLY:
        </Text>
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"large"}
        >
          {total_supply.toLocaleString()}
        </Text>
      </HStack>

      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          FDMC:
        </Text>
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"large"}
        >
          {(total_supply * price).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {quote_data.symbol}
        </Text>
      </HStack>

      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          TVL:
        </Text>
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"large"}
        >
          {(
            quote_amount / Math.pow(10, quote_data.mint.decimals)
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {quote_data.symbol}
        </Text>
      </HStack>
      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          AMM FEE:
        </Text>
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"large"}
        >
          {amm.fee.toLocaleString()} Bps
        </Text>
      </HStack>
      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          BORROW FEE:
        </Text>
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"large"}
        >
          {amm.borrow_cost.toLocaleString()} Bps
        </Text>
      </HStack>

      <HStack px={5} justify="space-between" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          EXTENSIONS:
        </Text>
        <ShowExtensions extension_flag={0} />
      </HStack>
    </VStack>
  );
};

const ChartComponent = (props) => {
  const { data, additionalPixels } = props;

  const chartContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const totalHeight = (60 * window.innerHeight) / 100 + additionalPixels; // Calculate total height
    const chart = createChart(chartContainerRef.current);

    const myPriceFormatter = (p) => p.toExponential(2);

    chart.applyOptions({
      layout: {
        background: { color: "#171B26" },
        textColor: "#DDD",
      },
      grid: {
        vertLines: { color: "#242733" },
        horzLines: { color: "#242733" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });

    chart.timeScale().fitContent();

    const newSeries = chart.addCandlestickSeries({
      upColor: "#4EFF3F",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#4EFF3F",
      wickDownColor: "#ef5350",
      priceFormat: {
        type: "custom",
        formatter: (price) => price.toExponential(2),
        minMove: 0.000000001,
      },
    });

    newSeries.setData(data);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, additionalPixels]);

  return (
    <HStack
      ref={chartContainerRef}
      justify="center"
      id="chartContainer"
      w="100%"
      style={{
        height: `calc(62vh + ${additionalPixels}px)`,
        overflow: "auto",
        position: "relative",
        borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
      }}
    />
  );
};

export default TradePage;

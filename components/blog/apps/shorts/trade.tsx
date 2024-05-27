import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  MintData,
  TokenAccount,
  bignum_to_num,
  request_raw_account_data,
  request_token_amount,
  request_token_supply,
  setMintData,
  uInt32ToLEBytes,
} from "../common";
import { TimeSeriesData, AMMData, PROGRAM, AMMLaunch } from "./state";
import { useCallback, useEffect, useState, useRef } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  Mint,
  getTransferFeeConfig,
  calculateFee,
  unpackMint,
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
import useResponsive from "../commonHooks/useResponsive";
import Image from "next/image";
import { MdOutlineContentCopy } from "react-icons/md";
import { PiArrowsOutLineVerticalLight } from "react-icons/pi";
import WoodenButton from "../utils/woodenButton";
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";
import trimAddress from "../utils/trimAddress";
import { FaChartLine, FaInfo, FaPowerOff } from "react-icons/fa";
import usePlaceMarketOrder from "./hooks/usePlaceMarketOrder";

import UseWalletConnection from "../commonHooks/useWallet";
import ShowExtensions from "../utils/extensions";
import { getSolscanLink } from "../utils/getSolscanLink";
import { IoMdSwap } from "react-icons/io";
import useUpdateLiquidity from "./hooks/useUpdateCookLiquidity";

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

  const [mobilePageContent, setMobilePageContent] = useState("Chart");

  const [market_data, setMarketData] = useState<MarketData[]>([]);
  const [daily_data, setDailyData] = useState<MarketData[]>([]);

  const [last_day_volume, setLastDayVolume] = useState<number>(0);

  const [base_address, setBaseAddress] = useState<PublicKey | null>(null);
  const [quote_address, setQuoteAddress] = useState<PublicKey | null>(null);
  const [price_address, setPriceAddress] = useState<PublicKey | null>(null);
  const [user_base_address, setUserBaseAddress] = useState<PublicKey | null>(
    null,
  );
  const [user_quote_address, setUserQuoteAddress] = useState<PublicKey | null>(
    null,
  );
  const [user_lp_address, setUserLPAddress] = useState<PublicKey | null>(null);

  const [amm_base_amount, setBaseAmount] = useState<number | null>(null);
  const [amm_quote_amount, setQuoteAmount] = useState<number | null>(null);
  const [amm_lp_amount, setLPAmount] = useState<number | null>(null);

  const [user_sol_amount, setUserSOLAmount] = useState<number>(0);
  const [user_base_amount, setUserBaseAmount] = useState<number>(0);
  const [user_quote_amount, setUserQuoteAmount] = useState<number>(0);
  const [user_lp_amount, setUserLPAmount] = useState<number>(0);

  const [total_supply, setTotalSupply] = useState<number>(0);

  const [amm, setAMM] = useState<AMMLaunch | null>(null);
  const [base_data, setBaseData] = useState<MintData | null>(null);
  const [quote_data, setQuoteData] = useState<MintData | null>(null);

  const base_ws_id = useRef<number | null>(null);
  const quote_ws_id = useRef<number | null>(null);
  const price_ws_id = useRef<number | null>(null);
  const user_sol_token_ws_id = useRef<number | null>(null);
  const user_base_token_ws_id = useRef<number | null>(null);
  const user_quote_token_ws_id = useRef<number | null>(null);
  const user_lp_token_ws_id = useRef<number | null>(null);

  const last_base_amount = useRef<number>(0);
  const last_quote_amount = useRef<number>(0);

  const check_market_data = useRef<boolean>(true);

  // when page unloads unsub from any active websocket listeners
  useEffect(() => {
    return () => {
      //console.log("in use effect return");
      const unsub = async () => {
        if (base_ws_id.current !== null) {
          await connection.removeAccountChangeListener(base_ws_id.current);
          base_ws_id.current = null;
        }
        if (quote_ws_id.current !== null) {
          await connection.removeAccountChangeListener(quote_ws_id.current);
          quote_ws_id.current = null;
        }
      };
      unsub();
    };
  }, [connection]);

  useEffect(() => {
    if (amm_base_amount === null || amm_quote_amount === null) {
      return;
    }

    if (
      amm_base_amount === last_base_amount.current &&
      amm_quote_amount === last_quote_amount.current
    ) {
      return;
    }

    last_base_amount.current = amm_base_amount;
    last_quote_amount.current = amm_quote_amount;
  }, [amm_base_amount, amm_quote_amount, market_data]);

  const check_base_update = useCallback(async (result: any) => {
    //console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    const [token_account] = TokenAccount.struct.deserialize(event_data);
    let amount = bignum_to_num(token_account.amount);
    //("update base amount", amount);
    setBaseAmount(amount);
  }, []);

  const check_quote_update = useCallback(async (result: any) => {
    //console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    const [token_account] = TokenAccount.struct.deserialize(event_data);
    let amount = bignum_to_num(token_account.amount);
    //console.log("update quote amount", amount);

    setQuoteAmount(amount);
  }, []);

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
    //console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    const [token_account] = TokenAccount.struct.deserialize(event_data);
    let amount = bignum_to_num(token_account.amount);
    // console.log("update quote amount", amount);

    setUserBaseAmount(amount);
  }, []);

  const check_user_quote_update = useCallback(async (result: any) => {
    console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    try {
      const [token_account] = TokenAccount.struct.deserialize(event_data);
      let amount = bignum_to_num(token_account.amount);
      // console.log("update quote amount", amount);

      setUserQuoteAmount(amount);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const check_user_lp_update = useCallback(async (result: any) => {
    //console.log(result);
    // if we have a subscription field check against ws_id

    let event_data = result.data;
    const [token_account] = TokenAccount.struct.deserialize(event_data);
    let amount = bignum_to_num(token_account.amount);
    // console.log("update quote amount", amount);

    setUserLPAmount(amount);
  }, []);

  // launch account subscription handler
  useEffect(() => {
    if (base_ws_id.current === null && base_address !== null) {
      //console.log("subscribe 1");

      base_ws_id.current = connection.onAccountChange(
        base_address,
        check_base_update,
        "confirmed",
      );
    }

    if (quote_ws_id.current === null && quote_address !== null) {
      // console.log("subscribe 2");

      quote_ws_id.current = connection.onAccountChange(
        quote_address,
        check_quote_update,
        "confirmed",
      );
    }

    if (price_ws_id.current === null && price_address !== null) {
      price_ws_id.current = connection.onAccountChange(
        price_address,
        check_price_update,
        "confirmed",
      );
    }

    if (user_base_token_ws_id.current === null && user_base_address !== null) {
      user_base_token_ws_id.current = connection.onAccountChange(
        user_base_address,
        check_user_base_update,
        "confirmed",
      );
    }
    if (
      user_quote_token_ws_id.current === null &&
      user_quote_address !== null
    ) {
      user_quote_token_ws_id.current = connection.onAccountChange(
        user_quote_address,
        check_user_quote_update,
        "confirmed",
      );
    }
    if (user_lp_token_ws_id.current === null && user_lp_address !== null) {
      user_lp_token_ws_id.current = connection.onAccountChange(
        user_lp_address,
        check_user_lp_update,
        "confirmed",
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
    check_base_update,
    check_quote_update,
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
      PROGRAM,
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
      baseMintData.token_program,
    );

    let user_quote_token_account_key = await getAssociatedTokenAddress(
      quote_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      quoteMintData.token_program,
    );

    let user_lp_token_account_key = await getAssociatedTokenAddress(
      lp_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      baseMintData.token_program,
    );
    // console.log(base_amm_account.toString(), quote_amm_account.toString());

    setBaseAddress(base_amm_account);
    setQuoteAddress(quote_amm_account);
    setUserBaseAddress(user_base_token_account_key);
    setUserQuoteAddress(user_quote_token_account_key);
    setUserLPAddress(user_lp_token_account_key);

    let base_amount = await request_token_amount(base_amm_account);
    let quote_amount = await request_token_amount(quote_amm_account);
    let user_base_amount = await request_token_amount(
      user_base_token_account_key,
    );
    let user_quote_amount = await request_token_amount(
      user_quote_token_account_key,
    );
    let user_lp_amount = await request_token_amount(user_lp_token_account_key);

    console.log(
      "user amounts",
      user_base_amount,
      user_lp_amount,
      base_amount,
      quote_amount,
    );
    setBaseAmount(base_amount);
    setQuoteAmount(quote_amount);
    setUserBaseAmount(user_base_amount);
    setUserLPAmount(user_lp_amount);
    setUserQuoteAmount(user_quote_amount);

    let total_supply = await request_token_supply(base_mint);
    setTotalSupply(total_supply / Math.pow(10, baseMintData.mint.decimals));

    setLPAmount(amm.amm_data.lp_amount);

    let index_buffer = uInt32ToLEBytes(0);
    let price_data_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
      PROGRAM,
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
    for (let i = 0; i < price_data.data.length; i++) {
      let item = price_data.data[i];
      let time = bignum_to_num(item.timestamp) * 60;
      let date = Math.floor(time / 24 / 60 / 60) * 24 * 60 * 60;

      let open = Buffer.from(item.open).readFloatLE(0);
      let high = Buffer.from(item.high).readFloatLE(0);
      let low = Buffer.from(item.low).readFloatLE(0);
      let close = Buffer.from(item.close).readFloatLE(0);
      let volume = Buffer.from(item.volume).readFloatLE(0);

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
                    amm.amm_data.base_mint.toString(),
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
      <HStack w="full" spacing={0} align="start" pb={sm ? 14 : 0}>
        {(!sm ||
          (sm &&
            (mobilePageContent === "Info" ||
              mobilePageContent === "Trade"))) && (
          <VStack
            py={5}
            align="start"
            w={sm ? "100%" : 320}
            style={{
              minWidth: "350px",
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
                <WoodenButton
                  action={() => {
                    leftPanel === "Info"
                      ? setLeftPanel("Trade")
                      : leftPanel === "Trade"
                        ? setLeftPanel("Info")
                        : setLeftPanel("Info");
                  }}
                  label={leftPanel === "Info" ? "Place Order" : "Info"}
                  size={22}
                  width="100%"
                />
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
                total_supply={total_supply}
                quote_amount={amm_quote_amount}
              />
            )}

            {leftPanel === "Trade" && (
              <BuyAndSell
                base_data={base_data}
                quote_data={quote_data}
                amm={amm.amm_data}
                base_balance={amm_base_amount}
                quote_balance={amm_quote_amount}
                amm_lp_balance={amm_lp_amount}
                user_base_balance={user_base_amount}
                user_quote_balance={user_quote_amount}
                user_lp_balance={user_lp_amount}
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

const BuyAndSell = ({
  base_data,
  quote_data,
  amm,
  base_balance,
  quote_balance,
  amm_lp_balance,
  user_base_balance,
  user_quote_balance,
  user_lp_balance,
}: {
  base_data: MintData;
  quote_data: MintData;
  amm: AMMData;
  base_balance: number;
  quote_balance: number;
  amm_lp_balance: number;
  user_base_balance: number;
  user_quote_balance: number;
  user_lp_balance: number;
}) => {
  const { xs } = useResponsive();
  const wallet = useWallet();
  const { handleConnectWallet } = UseWalletConnection();
  const [selected, setSelected] = useState("Buy");
  const [token_amount, setTokenAmount] = useState<number>(0);
  const [sol_amount, setSOLAmount] = useState<number>(0);
  const [order_type, setOrderType] = useState<number>(0);
  const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder();
  const { UpdateLiquidity, isLoading: updateLiquidityLoading } =
    useUpdateLiquidity();

  const handleClick = (tab: string) => {
    setSelected(tab);

    if (tab == "Buy") setOrderType(0);
    if (tab == "Sell") setOrderType(1);
  };

  let base_raw = Math.floor(
    token_amount * Math.pow(10, base_data.mint.decimals),
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
      calculateFee(transfer_fee_config.newerTransferFee, BigInt(base_raw)),
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
    sol_amount * Math.pow(10, quote_data.mint.decimals),
  );
  let amm_quote_fee = Math.ceil((quote_raw * amm.fee) / 100 / 100);
  let quote_input_amount = quote_raw - amm_quote_fee;
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
    quote_no_slip * Math.pow(10, quote_data.mint.decimals) * 2,
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

  console.log("quote: ", user_quote_balance);

  return (
    <VStack align="start" px={5} w="100%" mt={-2} spacing={4}>
      <HStack align="center" spacing={0} zIndex={99} w="100%">
        {["Buy", "Sell", "LP+", "LP-"].map((name, i) => {
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
            <Box
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
              w={"50%"}
            >
              <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                {name}
              </Text>
            </Box>
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
          ) : (
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Swap:
            </Text>
          )}
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
                      2,
                  );
                }

                if (selected === "Sell") {
                  setTokenAmount(
                    user_base_balance /
                      Math.pow(10, base_data.mint.decimals) /
                      2,
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
                    user_quote_balance / Math.pow(10, quote_data.mint.decimals),
                  );
                }

                if (selected === "Sell") {
                  setTokenAmount(
                    user_base_balance / Math.pow(10, base_data.mint.decimals),
                  );
                }
              }}
            >
              Max
            </Text>
          </HStack>
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
                  !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                    ? parseFloat(e.target.value)
                    : sol_amount,
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
        ) : (
          <InputGroup size="md">
            <Input
              color="white"
              size="lg"
              borderColor="rgba(134, 142, 150, 0.5)"
              value={token_amount}
              onChange={(e) => {
                setTokenAmount(
                  !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                    ? parseFloat(e.target.value)
                    : token_amount,
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
        )}
      </VStack>

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
        ) : selected === "Sell" || selected === "LP+" || selected === "LP-" ? (
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
              value={base_output_string === "NaN" ? "0" : base_output_string}
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
        ) : selected === "Sell" || selected === "LP+" || selected === "LP-" ? (
          <InputGroup size="md">
            <Input
              readOnly={true}
              color="white"
              size="lg"
              borderColor="rgba(134, 142, 150, 0.5)"
              value={quote_output_string === "NaN" ? "0" : quote_output_string}
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
      ) : (
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
                : PlaceMarketOrder(amm, token_amount, sol_amount, order_type);
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
        height: `calc(60vh + ${additionalPixels}px)`,
        overflow: "auto",
        position: "relative",
        borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
      }}
    />
  );
};

export default TradePage;

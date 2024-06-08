import {
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Link,
  TableContainer,
  Text,
  VStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../commonHooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
  Keypair,
} from "@solana/web3.js";
import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import styles from "../../../..//styles/Launch.module.css";
import { AMMData, AMMLaunch } from "./state";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import useExitShort from "./hooks/useExitShort";
import { Mint } from "@solana/spl-token";
import { formatPrice, getAttributes } from "./trade";
import { bignum_to_num } from "../common";
import useLiquidateShort from "./hooks/useLiquidateShort";
import useExitLong from "./hooks/useExitLong";
import useLiquidateLong from "./hooks/useLiquidateLong";
import { exit } from "process";

interface Header {
  text: string;
  field: string | null;
}

const ShortsTable = ({
  is_2022,
  amm,
  base_mint,
  quote_mint,
  collection,
  shortsList,
  mode,
  direction,
}: {
  is_2022: boolean;
  amm: AMMLaunch;
  base_mint: Mint;
  quote_mint: Mint;
  collection: PublicKey;
  shortsList: AssetV1[];
  mode: number;
  direction: string;
}) => {
  const { xs, sm, lg } = useResponsive();
  const wallet = useWallet();

  const [sortedField, setSortedField] = useState<string | null>("type");
  const [reverseSort, setReverseSort] = useState<boolean>(true);

  const handleHeaderClick = (e) => {
    if (e == sortedField) {
      setReverseSort(!reverseSort);
    } else {
      setSortedField(e);
      setReverseSort(false);
    }
  };

  function filterTable(mode: number) {
    return shortsList.filter(function (item) {
      let attributes = getAttributes(item);
      let asset_direction = attributes.get("direction");
      if (asset_direction !== direction) {
        return false;
      }
      // sell table - only the owner can do this
      if (mode == 0) {
        return item.owner.toString() === wallet.publicKey.toString();
      }
      //liquidate - anyone can do this
      if (mode == 1) {
        return (true);
      }
    });
  }

  let borrow_unit = direction === "short" ? amm.quote.symbol : amm.base.symbol;

  const tableHeaders: Header[] = [
    { text: "NUM TOKENS", field: "number tokens" },
    { text: "ENTRY PRICE", field: "entry price" },
    { text: "LIQUIDATION PRICE", field: "liquidation price" },
    { text: "EXECUTION PRICE", field: "liquidation price" },
    { text: "BORROW FEE (" + borrow_unit + ")", field: "borrow fee" },
    { text: "PROFIT (" + borrow_unit + ")", field: "pnl" },
  ];

  if (collection === null || amm === null) {
    return <></>;
  }

  return (
    <>
      <TableContainer w="100%">
        <table width="100%" className="custom-centered-table font-face-rk">
          <thead>
            <tr
              style={{
                height: "50px",
                borderTop: "1px solid rgba(134, 142, 150, 0.5)",
                borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
              }}
            >
              {tableHeaders.map((i) => (
                <th
                  key={i.text}
                  style={{ color: "white", minWidth: sm ? "90px" : "110px" }}
                >
                  <HStack gap={sm ? 1 : 10} justify="center">
                    <Text
                      fontSize={sm ? "medium" : "large"}
                      m={0}
                      pl={sm ? 1 : 5}
                      pr={sm ? 1 : 5}
                      onClick={
                        i.field !== null
                          ? () => handleHeaderClick(i.field)
                          : () => {}
                      }
                    >
                      {i.text}
                    </Text>
                  </HStack>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filterTable(mode)
              .sort()
              .map((short: AssetV1, index) => (
                <LaunchCard
                  key={index}
                  is_2022={is_2022}
                  amm={amm.amm_data}
                  base_mint={base_mint}
                  quote_mint={quote_mint}
                  collection={collection}
                  asset={short}
                  mode={mode}
                  direction={direction}
                />
              ))}
          </tbody>
        </table>
      </TableContainer>
    </>
  );
};

const LaunchCard = ({
  is_2022,
  amm,
  base_mint,
  quote_mint,
  collection,
  asset,
  mode,
  direction,
}: {
  is_2022: boolean;
  amm: AMMData;
  base_mint: Mint;
  quote_mint: Mint;
  collection: PublicKey;
  asset: AssetV1;
  mode: number;
  direction: string;
}) => {
  const router = useRouter();
  const { xs, sm, md, lg } = useResponsive();

  const [price, setPrice] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePriceChange = (e) => {
    setPrice(e.target.value);
  };

  const { ExitShort, isLoading: isExitLoading } = useExitShort();
  const { LiquidateShort, isLoading: isLiquidateLoading } = useLiquidateShort();
  const { ExitLong, isLoading: isLongExitLoading } = useExitLong();
  const { LiquidateLong, isLoading: isLongLiquidateLoading } =
    useLiquidateLong();

  let amm_base_balance = bignum_to_num(amm.amm_base_amount);
  let amm_quote_balance = bignum_to_num(amm.amm_quote_amount);

  let attributes = getAttributes(asset);
  let borrowed_base = parseFloat(attributes.get("base_amount"));
  let borrowed_quote = parseFloat(attributes.get("quote_amount"));
  let deposit = parseFloat(attributes.get("deposit_amount"));
  let entry_price = parseFloat(attributes.get("entry_price"));
  let start_time = parseFloat(attributes.get("start_time"));
  let liquidation_price = parseFloat(attributes.get("liquidation_price"));

  let annual_borrow_fee;
  let fee_decimals;
  let liquidate;
  let exit_trade_base;
  let exit_trade_quote;
  if (direction === "short") {
    annual_borrow_fee = borrowed_quote * (amm.borrow_cost / 100 / 100);
    fee_decimals = quote_mint.decimals;
    exit_trade_base = borrowed_base;
    exit_trade_quote =
      (borrowed_base * amm_quote_balance) / (amm_base_balance - borrowed_base);
    exit_trade_quote = Math.floor(exit_trade_quote / (1 - amm.fee / 100 / 100));
    liquidate = exit_trade_quote >= borrowed_quote + deposit;
  } else {
    annual_borrow_fee = borrowed_base * (amm.borrow_cost / 100 / 100);
    fee_decimals = base_mint.decimals;
    exit_trade_base =
      (borrowed_quote * amm_base_balance) /
      (amm_quote_balance - borrowed_quote);
    exit_trade_base = Math.floor(exit_trade_base / (1 - amm.fee / 100 / 100));
    exit_trade_quote = borrowed_quote;
    liquidate = exit_trade_base >= borrowed_base + deposit;
  }

  if (mode == 1 && !liquidate) {
    return <></>;
  }

  let current_time = new Date().getTime() / 1000;
  let time_delta_years = (current_time - start_time) / 60 / 60 / 24 / 365;
  let borrow_fee =
    Math.floor(time_delta_years * annual_borrow_fee + 1) /
    Math.pow(10, fee_decimals);

  let execution_price =
    exit_trade_quote /
    Math.pow(10, quote_mint.decimals) /
    (exit_trade_base / Math.pow(10, base_mint.decimals));

  let profit;
  if (direction === "short") {
    profit =
      (borrowed_quote - exit_trade_quote) / Math.pow(10, quote_mint.decimals) -
      borrow_fee;
  } else {
    profit =
      (borrowed_base - exit_trade_base) / Math.pow(10, base_mint.decimals) -
      borrow_fee;
  }

  let price_decimals = Math.min(5, quote_mint.decimals);
  return (
    <>
      <tr
        style={{
          cursor: "pointer",
          height: "60px",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = ""; // Reset to default background color
        }}
      >
        <td style={{ minWidth: "160px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {borrowed_base / Math.pow(10, base_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: sm ? "170px" : "200px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(entry_price, price_decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(liquidation_price, price_decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(execution_price, price_decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(borrow_fee, Math.min(5, fee_decimals))}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(profit, Math.min(5, fee_decimals))}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          {mode === 0 && (
            <Button
              onClick={() => {
                direction === "short"
                  ? ExitShort(amm, asset)
                  : ExitLong(amm, asset);
              }}
              style={{ textDecoration: "none" }}
            >
              Exit
            </Button>
          )}
          {mode === 1 && (
            <Button
              onClick={() => {
                direction === "short"
                  ? LiquidateShort(amm, asset)
                  : LiquidateLong(amm, asset);
              }}
              style={{ textDecoration: "none" }}
            >
              Liquidate
            </Button>
          )}
        </td>
      </tr>
    </>
  );
};

export default ShortsTable;

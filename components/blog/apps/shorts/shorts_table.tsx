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
import { AMMData } from "./state";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import useExitShort from "./hooks/useExitShort";
import { Mint } from "@solana/spl-token";
import { formatPrice, getAttributes } from "./trade";
import { bignum_to_num } from "../common";
import useLiquidateShort from "./hooks/useLiquidateShort";

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
}: {
  is_2022: boolean;
  amm: AMMData;
  base_mint: Mint;
  quote_mint: Mint;
  collection: PublicKey;
  shortsList: AssetV1[];
  mode: number;
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
      // sell table
      if (mode == 0) {
        return item.owner.toString() === wallet.publicKey.toString();
      }
      //liquidate
      if (mode == 1) {
        return (
          wallet !== null &&
          wallet.publicKey !== null &&
          item.owner.toString() === wallet.publicKey.toString()
        );
      }
    });
  }

  const tableHeaders: Header[] = [
    { text: "NUM TOKENS", field: "number tokens" },
    { text: "SHORT PRICE", field: "short price" },
    { text: "LIQUIDATION PRICE", field: "liquidation price" },
    { text: "EXECUTION PRICE", field: "liquidation price" },
    { text: "BORROW FEE", field: "borrow fee" },
    { text: "PNL", field: "pnl" },
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
                  amm={amm}
                  base_mint={base_mint}
                  quote_mint={quote_mint}
                  collection={collection}
                  asset={short}
                  mode={mode}
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
}: {
  is_2022: boolean;
  amm: AMMData;
  base_mint: Mint;
  quote_mint: Mint;
  collection: PublicKey;
  asset: AssetV1;
  mode: number;
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

  let quote_post_fees = Math.floor(quote_output / (1 - amm.fee / 100 / 100));

  let liquidate = quote_post_fees >= quote_input + deposit;

  if (mode == 1 && !liquidate) {
    return <></>;
  }

  let current_time = new Date().getTime() / 1000;
  let time_delta_years = (current_time - start_time) / 60 / 60 / 24 / 365;
  let borrow_fee =
    Math.floor(
      time_delta_years * quote_input * (amm.borrow_cost / 100 / 100) + 1
    ) / Math.pow(10, quote_mint.decimals);
  let profit =
    (quote_input - quote_post_fees) / Math.pow(10, quote_mint.decimals) -
    borrow_fee;
  console.log(quote_input, quote_post_fees, borrow_fee, profit, deposit);
  //console.log(launch);
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
            {base_input / Math.pow(10, base_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: sm ? "170px" : "200px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(short_price, quote_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(liquidation_price, quote_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(quote_post_fees/Math.pow(10, quote_mint.decimals)/base_input, 5)}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(borrow_fee, quote_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {formatPrice(profit, quote_mint.decimals)}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          {mode === 0 && (
            <Button
              onClick={() => ExitShort(amm, asset)}
              style={{ textDecoration: "none" }}
            >
              Sell
            </Button>
          )}
          {mode === 1 && (
            <Button
              onClick={() => LiquidateShort(amm, asset)}
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

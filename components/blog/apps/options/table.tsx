import { useEffect, useState, useCallback } from "react";
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
import useResponsive from "./hooks/useResponsive";
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
import { OptionData } from "./state";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import usePurchaseOption from "./hooks/usePurchaseOption";
import useExecuteOption from "./hooks/useExecuteOption";
import useRefundOption from "./hooks/useRefundOption";
import useRelistOption from "./hooks/useRelistOption";
import { Mint } from "@solana/spl-token";

interface Header {
  text: string;
  field: string | null;
}

interface Attributes {
  creator: PublicKey;
  token_mint: PublicKey;
  side: string;
  strike: string;
  tokens: string;
  expiry: Date;
  price: string;
  seller: PublicKey;
  listed: number;
}

function getAttributes(option: AssetV1) {
  let attributes = option.attributes.attributeList;
  let side = "";
  let strike = "";
  let tokens = "";
  let expiry = "";
  let price = "";
  let seller = "";
  let listed = "";
  let creator = "";
  let token_mint = "";

  for (let i = 0; i < attributes.length; i++) {
    if (attributes[i].key == "side") side = attributes[i].value;
    if (attributes[i].key == "strike_price") strike = attributes[i].value;
    if (attributes[i].key == "token_amount") tokens = attributes[i].value;
    if (attributes[i].key == "end_time") expiry = attributes[i].value;
    if (attributes[i].key == "option_price") price = attributes[i].value;
    if (attributes[i].key == "seller") seller = attributes[i].value;
    if (attributes[i].key == "listed") listed = attributes[i].value;
    if (attributes[i].key == "creator") creator = attributes[i].value;
    if (attributes[i].key == "token_mint") token_mint = attributes[i].value;
  }

  let result: Attributes = {
    creator: creator !== "" ? new PublicKey(creator) : new PublicKey(seller),
    token_mint:
      token_mint !== "" ? new PublicKey(token_mint) : new PublicKey(seller),
    side: side,
    strike: strike,
    tokens: tokens,
    expiry: new Date(parseInt(expiry)),
    price: price,
    seller: new PublicKey(seller),
    listed: parseInt(listed),
  };

  return result;
}

const OptionsTable = ({
  is_2022,
  mint,
  collection,
  optionsList,
  mode,
  update,
}: {
  is_2022: boolean;
  mint: Mint;
  collection: PublicKey;
  optionsList: AssetV1[];
  mode: number;
  update: () => Promise<void>;
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
    return optionsList.filter(function (item) {
      let attributes = getAttributes(item);
      // purchase table
      if (mode == 0) {
        return (
          attributes.listed == 1 &&
          attributes.expiry.getTime() > new Date().getTime()
        );
      }
      //execute
      if (mode == 1) {
        return (
          wallet !== null &&
          wallet.publicKey !== null &&
          item.owner.toString() === wallet.publicKey.toString()
        );
      }
      // refund table
      if (mode == 2) {
        return (
          wallet !== null &&
          wallet.publicKey !== null &&
          attributes.seller.equals(wallet.publicKey)
        );
      }
    });
  }

  const tableHeaders: Header[] = [
    { text: "TYPE", field: "type" },
    { text: "NUM TOKENS", field: "number tokens" },
    { text: "STRIKE PRICE", field: "strike" },
    { text: "OPTION PRICE", field: "option price" },
    { text: "EXPIRY DATE", field: "expiry date" },
  ];

  return (
    <>
      <TableContainer>
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
                  style={{ color: "white", minWidth: sm ? "90px" : "120px" }}
                >
                  <HStack gap={sm ? 1 : 15} justify="center">
                    <Text
                      fontSize={sm ? "medium" : "large"}
                      m={0}
                      pl={sm ? 1 : 10}
                      pr={sm ? 1 : 10}
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

              <th>
                <Box mt={1} as="button">
                  <TfiReload size={sm ? 18 : 20} onClick={update} />
                </Box>
              </th>
            </tr>
          </thead>

          <tbody>
            {filterTable(mode)
              .sort()
              .map((option: AssetV1, index) => (
                <LaunchCard
                  key={index}
                  is_2022={is_2022}
                  mint={mint}
                  collection={collection}
                  option={option}
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
  mint,
  collection,
  option,
  mode,
}: {
  is_2022: boolean;
  mint: Mint;
  collection: PublicKey;
  option: AssetV1;
  mode: number;
}) => {
  const router = useRouter();
  const { xs, sm, md, lg } = useResponsive();

  const [price, setPrice] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePriceChange = (e) => {
    setPrice(e.target.value);
  };

  const { PurchaseOption, isLoading: isPurchaseLoading } = usePurchaseOption();
  const { RefundOption, isLoading: isRefundLoading } = useRefundOption();
  const { ExecuteOption, isLoading: isExecuteLoading } = useExecuteOption();
  const { RelistOption, isLoading: isRelistLoading } = useRelistOption();

  let attributes = getAttributes(option);

  console.log(attributes);

  let splitLaunchDate = attributes.expiry.toUTCString().split(" ");
  let launchDateString =
    splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
  let splitLaunchTime = splitLaunchDate[4].split(":");
  let launchTimeString = splitLaunchTime[0] + ":" + splitLaunchTime[1];

  let time_left = attributes.expiry.getTime() - new Date().getTime();
  time_left /= 1000 * 24 * 60 * 60;
  let time_string = time_left.toFixed(1) + " days";
  if (time_left < 0.1) {
    time_left *= 24;
    time_string = time_left.toFixed(1) + " hrs";
  }
  if (time_left < 0.1) {
    time_left *= 60;
    time_string = time_left.toFixed(1) + " min";
  }

  console.log(option);
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
            {attributes.side == "0" ? "CALL" : "PUT"}
          </Text>
        </td>
        <td style={{ minWidth: sm ? "170px" : "200px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {attributes.tokens}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {attributes.strike}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {attributes.price}
          </Text>
        </td>
        <td style={{ minWidth: "170px" }}>
          <Text color="white" fontSize={"large"} m={0}>
            {launchDateString + " " + launchTimeString}
          </Text>
        </td>
        <td style={{ minWidth: "150px" }}>
          {mode === 0 && (
            <Button
              onClick={() =>
                PurchaseOption(
                  new PublicKey(option.publicKey.toString()),
                  collection,
                  attributes.seller,
                )
              }
              style={{ textDecoration: "none" }}
            >
              Buy
            </Button>
          )}
          {mode === 1 && time_left > 0 && (
            <HStack>
              <Button
                onClick={() =>
                  ExecuteOption(
                    is_2022,
                    mint,
                    new PublicKey(option.publicKey.toString()),
                    collection,
                    attributes.creator,
                    attributes.token_mint,
                  )
                }
                style={{ textDecoration: "none" }}
              >
                Execute
              </Button>
              <Button onClick={onOpen} style={{ textDecoration: "none" }}>
                Relist
              </Button>
            </HStack>
          )}
          {mode === 1 && time_left < 0 && (
            <Button
              onClick={() =>
                RefundOption(
                  is_2022,
                  mint,
                  new PublicKey(option.publicKey.toString()),
                  collection,
                  new PublicKey(option.owner.toString()),
                  attributes.creator,
                  attributes.token_mint,
                )
              }
              style={{ textDecoration: "none" }}
            >
              Burn
            </Button>
          )}
          {mode === 2 && time_left > 0 && (
            <Text color="white" fontSize={"large"} m={0}>
              Wait {time_string}
            </Text>
          )}
          {mode === 2 && time_left < 0 && (
            <Button
              onClick={() =>
                RefundOption(
                  is_2022,
                  mint,
                  new PublicKey(option.publicKey.toString()),
                  collection,
                  new PublicKey(option.owner.toString()),
                  attributes.creator,
                  attributes.token_mint,
                )
              }
              style={{ textDecoration: "none" }}
            >
              Refund
            </Button>
          )}
        </td>
      </tr>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          bg="url(/images/square-frame.png)"
          bgSize="contain"
          bgRepeat="no-repeat"
          h={345}
          py={xs ? 6 : 12}
          px={xs ? 8 : 10}
        >
          <ModalBody>
            <VStack
              align="start"
              justify={"center"}
              h="100%"
              spacing={0}
              mt={xs ? -8 : 0}
            >
              <Text className="font-face-kg" color="white" fontSize="x-large">
                Set Price
              </Text>
              <Input
                placeholder={"Enter New Price"}
                size={lg ? "md" : "lg"}
                maxLength={25}
                required
                type="text"
                value={price}
                onChange={handlePriceChange}
                color="white"
              />
              <HStack mt={xs ? 6 : 10} justify="end" align="end" w="100%">
                <Text
                  mr={3}
                  align="end"
                  fontSize={"medium"}
                  style={{
                    fontFamily: "KGSummerSunshineBlackout",
                    color: "#fc3838",
                    cursor: "pointer",
                  }}
                  onClick={onClose}
                >
                  Go Back
                </Text>
                <button
                  type="button"
                  onClick={async () => {
                    RelistOption(
                      new PublicKey(option.publicKey.toString()),
                      collection,
                      price,
                    );
                  }}
                  className={`${styles.nextBtn} font-face-kg`}
                >
                  List
                </button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default OptionsTable;

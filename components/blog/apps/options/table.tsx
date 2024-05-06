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
import { OptionData } from "./state";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import usePurchaseOption from "./hooks/usePurchaseOption";
interface Header {
  text: string;
  field: string | null;
}

const OptionsTable = ({ collection, optionsList }: { collection: PublicKey, optionsList: AssetV1[] }) => {
  const { sm } = useResponsive();

  const [sortedField, setSortedField] = useState<string | null>("type");
  const [reverseSort, setReverseSort] = useState<boolean>(true);


  const tableHeaders: Header[] = [
    { text: "TYPE", field: "type" },
    { text: "NUM TOKENS", field: "number tokens" },
    { text: "STRIKE PRICE", field: "strike" },
    { text: "OPTION PRICE", field: "option price" },
    { text: "EXPIRY DATE", field: "expiry date" },
  ];

  return (
    
    <TableContainer>
      <table
        width="100%"
        className="custom-centered-table font-face-rk"
       
      >
        <thead>
          <tr
            style={{
              height: "50px",
              borderTop: "1px solid rgba(134, 142, 150, 0.5)",
              borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
            }}
          >
            {tableHeaders.map((i) => (
              <th key={i.text} style={{ color:"white", minWidth: sm ? "90px" : "120px" }}>
                <HStack
                  gap={sm ? 1 : 10}
                  justify="center"
                  style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                >
                  <Text fontSize={sm ? "medium" : "large"} m={0}>
                    {i.text}
                  </Text>
                   <FaSort />
                </HStack>
              </th>
            ))}

            <th>
              <Box mt={1} as="button">
                <TfiReload size={sm ? 18 : 20} />
              </Box>
            </th>
          </tr>
        </thead>

        <tbody>
          {optionsList.map((option: AssetV1, index) => (
            <LaunchCard collection={collection} option={option} />
          ))}
        </tbody>
      </table>
    </TableContainer>
  );
};

const LaunchCard = ({ collection, option }: { collection : PublicKey, option: AssetV1 }) => {
  const router = useRouter();
  const { sm, md, lg } = useResponsive();
  const { PurchaseOption, isLoading: isPurchaseLoading } = usePurchaseOption()

  let attributes = option.attributes.attributeList;
  let side = "";
  let strike = "";
  let tokens = "";
  let expiry = "";
  let price = ""
  let seller = ""
  let listed = ""

  for (let i = 0; i < attributes.length; i++) {
    if (attributes[i].key == "side")
        side = attributes[i].value;
    if (attributes[i].key == "strike_price")
        strike = attributes[i].value;
    if (attributes[i].key == "token_amount")
        tokens = attributes[i].value;
    if (attributes[i].key == "end_time")
        expiry = attributes[i].value;
    if (attributes[i].key == "option_price")
        price = attributes[i].value;
    if (attributes[i].key == "seller")
        seller = attributes[i].value;
    if (attributes[i].key == "listed")
        listed = attributes[i].value;
  }
  
  if (listed == "0")
    return(<></>)
  
  let date = new Date(parseInt(expiry));

  let splitLaunchDate = date.toUTCString().split(" ");
  let launchDateString =
    splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
  let splitLaunchTime = splitLaunchDate[4].split(":");
  let launchTimeString = splitLaunchTime[0] + ":" + splitLaunchTime[1];

  console.log("option", option)
  //console.log(launch);
  return (
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
          {side == "0" ? "CALL" : "PUT"}
        </Text>
      </td>
      <td style={{ minWidth: sm ? "170px" : "200px" }}>
        <Text color="white"  fontSize={"large"} m={0}>
          {tokens}
        </Text>
      </td>
      <td style={{ minWidth: "150px" }}>
        <Text color="white"  fontSize={"large"} m={0}>
          {strike}
        </Text>
      </td>
      <td style={{ minWidth: "170px" }}>
        <Text color="white"  fontSize={"large"} m={0}>
          {price}
        </Text>
      </td>
      <td style={{ minWidth: "170px" }}>
        <Text color="white"  fontSize={"large"} m={0}>
          {launchDateString + " " + launchTimeString}
        </Text>
      </td>
      <td style={{ minWidth: "100px" }}>
        <Button onClick={() => PurchaseOption(new PublicKey(option.publicKey.toString()), collection, new PublicKey(seller))} style={{ textDecoration: "none" }}>
          Buy
        </Button>
      </td>
    </tr>
  );
};

export default OptionsTable;

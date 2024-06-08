import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  Mint,
  getTransferFeeConfig,
  calculateFee,
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
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Popover,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import Image from "next/image";
import { FaChartLine, FaInfo, FaPowerOff } from "react-icons/fa";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import styles from "/styles/Launch.module.css";
import useResponsive from "../../../../hooks/useResponsive";
import useCreateOption from "../../../blog/apps/options/hooks/useCreateOption";

export const OptionsPanel = ({
  mint_data,
  is_2022,
  token_balance,
  sol_balance,
  icon,
  uri,
  symbol,
}: {
  mint_data: Mint;
  is_2022: boolean;
  token_balance: number;
  sol_balance: number;
  icon: string;
  uri: string;
  symbol: string;
}) => {
  const { sm, xs } = useResponsive();
  const wallet = useWallet();
  const [selected, setSelected] = useState("Call");
  const [token_amount, setTokenAmount] = useState<number>(0);
  const [strike_price, setStrikePrice] = useState<number>(0);
  const [order_type, setOrderType] = useState<number>(0);
  const [option_price, setOptionPrice] = useState<number>(0);

  const [localExpiryDate, setLocalExpiryDate] = useState<Date>(
    new Date(new Date().setHours(0, 0, 0, 0))
  );
  const [expiryDateAndTime, setExpiryDateAndTime] = useState("-- --");

  const { CreateOption, isLoading: isOptionLoading } = useCreateOption(
    symbol,
    uri,
    mint_data.address.toString()
  );

  const local_date = useMemo(() => new Date(), []);
  var zone = new Date()
    .toLocaleTimeString("en-us", { timeZoneName: "short" })
    .split(" ")[2];
  //console.log(zone);

  useEffect(() => {
    let splitLaunchDate = localExpiryDate.toString().split(" ");
    let launchDateString =
      splitLaunchDate[0] +
      " " +
      splitLaunchDate[1] +
      " " +
      splitLaunchDate[2] +
      " " +
      splitLaunchDate[3];
    let splitLaunchTime = splitLaunchDate[4].split(":");
    let launchTimeString =
      splitLaunchTime[0] + ":" + splitLaunchTime[1] + " " + zone;
    setExpiryDateAndTime(`${launchDateString} ${launchTimeString}`);
  }, [localExpiryDate, local_date, zone]);

  const {
    isOpen: isStartOpen,
    onToggle: onToggleStart,
    onClose: onCloseStart,
  } = useDisclosure();

  const handleClick = (tab: string) => {
    setSelected(tab);

    if (tab == "Call") setOrderType(0);
    if (tab == "Put") setOrderType(1);
  };

  //console.log("Mint data", mint_data);
  let transfer_fee = 0;
  let max_transfer_fee = 0;
  let transfer_fee_config = getTransferFeeConfig(mint_data);
  if (transfer_fee_config !== null) {
    transfer_fee = transfer_fee_config.newerTransferFee.transferFeeBasisPoints;
    max_transfer_fee =
      Number(transfer_fee_config.newerTransferFee.maximumFee) /
      Math.pow(10, mint_data.decimals);
  }

  return (
    <VStack align="start" w="100%" spacing={4}>
      <HStack align="center" spacing={0} zIndex={99} w="100%">
        {["Call", "Put"].map((name, i) => {
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
          {selected === "Put"
            ? sol_balance.toFixed(5)
            : token_balance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}{" "}
          {selected === "Put" ? "SOL" : symbol}
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
          Max Transfer Fee ({symbol}):
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
          {selected === "Call" ? (
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Number of Tokens you will sell to option owner:
            </Text>
          ) : (
            <Text
              m={0}
              color={"white"}
              fontFamily="ReemKufiRegular"
              fontSize={"medium"}
              opacity={0.5}
            >
              Number of Tokens you will buy from option owner:
            </Text>
          )}
        </HStack>
        (
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
                  : token_amount
              );
            }}
            type="number"
            min="0"
          />
          <InputRightElement h="100%" w={50}>
            <img
              src={icon}
              width={30}
              height={30}
              alt=""
              style={{ borderRadius: "100%" }}
            />
          </InputRightElement>
        </InputGroup>
        )
      </VStack>

      <VStack align="start" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          Strike price per token:
        </Text>
        <InputGroup size="md">
          <Input
            color="white"
            size="lg"
            borderColor="rgba(134, 142, 150, 0.5)"
            value={strike_price}
            onChange={(e) => {
              setStrikePrice(
                !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                  ? parseFloat(e.target.value)
                  : strike_price
              );
            }}
            type="number"
            min="0"
          />
          <InputRightElement h="100%" w={50}>
            <Image
              src="/images/sol.png"
              width={30}
              height={30}
              alt="SOL Icon"
            />
          </InputRightElement>
        </InputGroup>
      </VStack>

      <VStack align="start" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          Price of the option:
        </Text>
        <InputGroup size="md">
          <Input
            color="white"
            size="lg"
            borderColor="rgba(134, 142, 150, 0.5)"
            value={option_price}
            onChange={(e) => {
              setOptionPrice(
                !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                  ? parseFloat(e.target.value)
                  : option_price
              );
            }}
            type="number"
            min="0"
          />
          <InputRightElement h="100%" w={50}>
            <Image
              src="/images/sol.png"
              width={30}
              height={30}
              alt="SOL Icon"
            />
          </InputRightElement>
        </InputGroup>
      </VStack>

      <VStack align="start" w="100%">
        <Text
          m={0}
          color={"white"}
          fontFamily="ReemKufiRegular"
          fontSize={"medium"}
          opacity={0.5}
        >
          Expiry Date:
        </Text>

        <div className={`${styles.textLabelInputDate} font-face-kg`}>
          <HStack spacing={5}>
            <Popover
              isOpen={isStartOpen}
              onClose={onCloseStart}
              placement="bottom"
              closeOnBlur={false}
            >
              <PopoverTrigger>
                <IconButton
                  onClick={onToggleStart}
                  aria-label="FaCalendarAlt"
                  icon={<FaCalendarAlt size={22} />}
                />
              </PopoverTrigger>
              <PopoverContent width="fit-content">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader h={34} />
                <PopoverBody>
                  <DatePicker
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    selected={localExpiryDate}
                    onChange={(date) => {
                      setLocalExpiryDate(date);
                      //onCloseStart();
                    }}
                    onClickOutside={() => onCloseStart()}
                    inline
                  />
                </PopoverBody>
              </PopoverContent>
            </Popover>

            <Text
              m="0"
              color="white"
              className="font-face-kg"
              fontSize={sm ? "small" : "small"}
            >
              {expiryDateAndTime}
            </Text>
          </HStack>
        </div>
      </VStack>

      <Button
        mt={2}
        mb="10px"
        size="lg"
        w="100%"
        px={4}
        py={2}
        bg={selected === "Call" ? "#83FF81" : "#FF6E6E"}
        //isLoading={placingOrder}
        onClick={() => {
          CreateOption(
            mint_data,
            is_2022,
            order_type,
            token_amount,
            strike_price,
            option_price,
            localExpiryDate.getTime()
          );
        }}
      >
        <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
          {!wallet.connected ? "Connect Wallet" : "Create"}
        </Text>
      </Button>
    </VStack>
  );
};

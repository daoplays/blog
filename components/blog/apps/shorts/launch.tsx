import { Dispatch, SetStateAction, useState } from "react";
import {
  Center,
  VStack,
  Text,
  HStack,
  Input,
  chakra,
  Flex,
  Box,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../../../styles/Launch.module.css";
import useResponsive from "../commonHooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { toast } from "react-toastify";
import {
  DEV_RPC_NODE,
  DEV_WSS_NODE,
  METAPLEX_META,
  MintData,
  setMintData,
} from "../common";
import {
  unpackMint,
  Mint,
  TOKEN_2022_PROGRAM_ID,
  getTransferHook,
  getTransferFeeConfig,
  getPermanentDelegate,
  getMetadataPointerState,
  getTokenMetadata,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { request_raw_account_data } from "../common";
import { Extensions, ShowExtensions } from "../utils/extensions";
import useInitAMM from "./hooks/useInitAMM";

const LaunchAMM = () => {
  const { sm, md, lg, xl } = useResponsive();
  const [base_address, setBaseAddress] = useState<string>("");
  const [base_token, setBaseToken] = useState<MintData | null>(null);
  const [quote_address, setQuoteAddress] = useState<string>("");
  const [quote_token, setQuoteToken] = useState<MintData | null>(null);

  const [base_amount, setBaseAmount] = useState<string>("");
  const [quote_amount, setQuoteAmount] = useState<string>("");
  const [swap_fee, setSwapFee] = useState<string>("");
  const [short_fraction, setShortFraction] = useState<string>("");
  const [borrow_cost, setBorrowCost] = useState<string>("");

  const { InitAMM, isLoading } = useInitAMM();

  async function handleSetBaseData() {
    setBaseToken(await setMintData(base_address));
  }
  async function handleSetQuoteData() {
    setQuoteToken(await setMintData(quote_address));
  }
  return (
    <Center
      style={{
        background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)",
      }}
      width="100%"
    >
      <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
        <Text
          align="start"
          className="font-face-kg"
          color={"white"}
          fontSize="x-large"
        >
          AMM Info:
        </Text>
        <form style={{ width: xl ? "100%" : "1200px" }}>
          <VStack px={lg ? 4 : 12} spacing={25}>
            <HStack
              w="100%"
              spacing={lg ? 10 : 12}
              style={{ flexDirection: lg ? "column" : "row" }}
            >
              <VStack spacing={8} flexGrow={1} align="start" width="100%">
                <HStack
                  w="100%"
                  spacing={lg ? 10 : 12}
                  style={{ flexDirection: lg ? "column" : "row" }}
                >
                  {base_token ? (
                    <VStack spacing={3}>
                      <Image
                        src={base_token.icon}
                        width={lg ? 180 : 180}
                        height={lg ? 180 : 180}
                        alt="Image Frame"
                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                      />
                      <ShowExtensions extension_flag={base_token.extensions} />
                    </VStack>
                  ) : (
                    <VStack
                      justify="center"
                      align="center"
                      style={{
                        minWidth: lg ? 180 : 180,
                        minHeight: lg ? 180 : 180,
                        cursor: "pointer",
                      }}
                      borderRadius={12}
                      border="2px dashed rgba(134, 142, 150, 0.5)"
                      as={chakra.label}
                      htmlFor="file"
                    >
                      <Text
                        mb={0}
                        fontSize="x-large"
                        color="white"
                        opacity={0.25}
                      >
                        Icon Preview
                      </Text>
                    </VStack>
                  )}

                  <VStack spacing={8} flexGrow={1} align="start" width="100%">
                    <HStack spacing={0} className={styles.eachField}>
                      <div
                        className={`${styles.textLabel} font-face-kg`}
                        style={{ minWidth: lg ? "100px" : "132px" }}
                      >
                        Base Token:
                      </div>

                      <div className={styles.textLabelInput}>
                        <Input
                          placeholder="Search Token"
                          size={lg ? "md" : "lg"}
                          required
                          className={styles.inputBox}
                          type="text"
                          value={base_address}
                          onChange={(e) => {
                            setBaseAddress(e.target.value);
                          }}
                        />
                      </div>

                      <div style={{ marginLeft: "12px" }}>
                        <label className={styles.label}>
                          <button
                            type="button"
                            onClick={() => {
                              handleSetBaseData();
                            }}
                            className={styles.browse}
                            style={{ cursor: "pointer", padding: "5px 10px" }}
                          >
                            Search
                          </button>
                        </label>
                      </div>
                    </HStack>

                    <Flex
                      gap={sm ? 8 : 5}
                      w="100%"
                      flexDirection={sm ? "column" : "row"}
                    >
                      <HStack spacing={5} className={styles.eachField}>
                        <div
                          className={`${styles.textLabel} font-face-kg`}
                          style={{ minWidth: lg ? "100px" : "100px" }}
                        >
                          Name:
                        </div>

                        <div className={styles.textLabelInput}>
                          <Input
                            placeholder="Token Name"
                            readOnly={true}
                            disabled
                            size={lg ? "md" : "lg"}
                            className={styles.inputBox}
                            type="text"
                            value={base_token ? base_token.name : ""}
                          />
                        </div>
                        <div
                          className={`${styles.textLabel} font-face-kg`}
                          style={{ minWidth: lg ? "100px" : "110px" }}
                        >
                          Symbol:
                        </div>
                        <div className={styles.textLabelInput}>
                          <Input
                            // pl={9}
                            bg="#494949"
                            placeholder="Token Symbol"
                            readOnly={true}
                            disabled
                            size={lg ? "md" : "lg"}
                            className={styles.inputBox}
                            type="text"
                            value={base_token ? base_token.symbol : ""}
                          />
                        </div>
                      </HStack>
                    </Flex>
                  </VStack>
                </HStack>
                <HStack
                  w="100%"
                  spacing={lg ? 10 : 12}
                  style={{ flexDirection: lg ? "column" : "row" }}
                >
                  {quote_token ? (
                    <VStack spacing={3}>
                      <Image
                        src={quote_token.icon}
                        width={lg ? 180 : 180}
                        height={lg ? 180 : 180}
                        alt="Image Frame"
                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                      />
                      <ShowExtensions extension_flag={quote_token.extensions} />
                    </VStack>
                  ) : (
                    <VStack
                      justify="center"
                      align="center"
                      style={{
                        minWidth: lg ? 180 : 180,
                        minHeight: lg ? 180 : 180,
                        cursor: "pointer",
                      }}
                      borderRadius={12}
                      border="2px dashed rgba(134, 142, 150, 0.5)"
                      as={chakra.label}
                      htmlFor="file"
                    >
                      <Text
                        mb={0}
                        fontSize="x-large"
                        color="white"
                        opacity={0.25}
                      >
                        Icon Preview
                      </Text>
                    </VStack>
                  )}

                  <VStack spacing={8} flexGrow={1} align="start" width="100%">
                    <HStack spacing={0} className={styles.eachField}>
                      <div
                        className={`${styles.textLabel} font-face-kg`}
                        style={{ minWidth: lg ? "100px" : "132px" }}
                      >
                        Quote Token:
                      </div>

                      <div className={styles.textLabelInput}>
                        <Input
                          placeholder="Search Token"
                          size={lg ? "md" : "lg"}
                          required
                          className={styles.inputBox}
                          type="text"
                          value={quote_address}
                          onChange={(e) => {
                            setQuoteAddress(e.target.value);
                          }}
                        />
                      </div>

                      <div style={{ marginLeft: "12px" }}>
                        <label className={styles.label}>
                          <button
                            type="button"
                            onClick={() => {
                              handleSetQuoteData();
                            }}
                            className={styles.browse}
                            style={{ cursor: "pointer", padding: "5px 10px" }}
                          >
                            Search
                          </button>
                        </label>
                      </div>
                    </HStack>

                    <Flex
                      gap={sm ? 8 : 5}
                      w="100%"
                      flexDirection={sm ? "column" : "row"}
                    >
                      <HStack spacing={5} className={styles.eachField}>
                        <div
                          className={`${styles.textLabel} font-face-kg`}
                          style={{ minWidth: lg ? "100px" : "100px" }}
                        >
                          Name:
                        </div>

                        <div className={styles.textLabelInput}>
                          <Input
                            placeholder="Token Name"
                            readOnly={true}
                            disabled
                            size={lg ? "md" : "lg"}
                            className={styles.inputBox}
                            type="text"
                            value={quote_token ? quote_token.name : ""}
                          />
                        </div>
                        <div
                          className={`${styles.textLabel} font-face-kg`}
                          style={{ minWidth: lg ? "100px" : "110px" }}
                        >
                          Symbol:
                        </div>
                        <div className={styles.textLabelInput}>
                          <Input
                            // pl={9}
                            bg="#494949"
                            placeholder="Token Symbol"
                            readOnly={true}
                            disabled
                            size={lg ? "md" : "lg"}
                            className={styles.inputBox}
                            type="text"
                            value={quote_token ? quote_token.symbol : ""}
                          />
                        </div>
                      </HStack>
                    </Flex>
                  </VStack>
                </HStack>
                <HStack spacing={0} w="100%" className={styles.eachField}>
                  <div
                    className={`${styles.textLabel} font-face-kg`}
                    style={{ minWidth: lg ? "100px" : "140px" }}
                  >
                    Base Amount:
                  </div>

                  <div className={styles.textLabelInput}>
                    <Input
                      bg="#494949"
                      placeholder="Enter Base Amount"
                      size={lg ? "md" : "lg"}
                      className={styles.inputBox}
                      type="text"
                      value={base_amount}
                      onChange={(e) => {
                        setBaseAmount(e.target.value);
                      }}
                    />
                  </div>
                </HStack>
                <HStack spacing={0} w="100%" className={styles.eachField}>
                  <div
                    className={`${styles.textLabel} font-face-kg`}
                    style={{ minWidth: lg ? "100px" : "140px" }}
                  >
                    Quote Amount:
                  </div>

                  <div className={styles.textLabelInput}>
                    <Input
                      bg="#494949"
                      placeholder="Enter Quote Amount"
                      size={lg ? "md" : "lg"}
                      className={styles.inputBox}
                      type="text"
                      value={quote_amount}
                      onChange={(e) => {
                        setQuoteAmount(e.target.value);
                      }}
                    />
                  </div>
                </HStack>
                <HStack spacing={0} w="100%" className={styles.eachField}>
                  <div
                    className={`${styles.textLabel} font-face-kg`}
                    style={{ minWidth: lg ? "100px" : "140px" }}
                  >
                    Short Frac:
                  </div>

                  <div className={styles.textLabelInput}>
                    <Input
                      bg="#494949"
                      placeholder="Enter Short Pool Fraction (10 = 10% of base amount)"
                      size={lg ? "md" : "lg"}
                      maxLength={8}
                      className={styles.inputBox}
                      type="text"
                      value={short_fraction}
                      onChange={(e) => {
                        setShortFraction(e.target.value);
                      }}
                    />
                  </div>
                </HStack>
                <HStack spacing={0} w="100%" className={styles.eachField}>
                  <div
                    className={`${styles.textLabel} font-face-kg`}
                    style={{ minWidth: lg ? "100px" : "140px" }}
                  >
                    AMM Fee:
                  </div>

                  <div className={styles.textLabelInput}>
                    <Input
                      bg="#494949"
                      placeholder="Enter AMM Fee (Bps - 100 = 1%)"
                      size={lg ? "md" : "lg"}
                      maxLength={8}
                      className={styles.inputBox}
                      type="text"
                      value={swap_fee}
                      onChange={(e) => {
                        setSwapFee(e.target.value);
                      }}
                    />
                  </div>
                </HStack>
                <HStack spacing={0} w="100%" className={styles.eachField}>
                  <div
                    className={`${styles.textLabel} font-face-kg`}
                    style={{ minWidth: lg ? "100px" : "140px" }}
                  >
                    Borrow Fee:
                  </div>

                  <div className={styles.textLabelInput}>
                    <Input
                      bg="#494949"
                      placeholder="Enter Short Borrow Fee (Bps - 100 = 1%)"
                      size={lg ? "md" : "lg"}
                      maxLength={8}
                      className={styles.inputBox}
                      type="text"
                      value={borrow_cost}
                      onChange={(e) => {
                        setBorrowCost(e.target.value);
                      }}
                    />
                  </div>
                </HStack>
              </VStack>
            </HStack>

            <HStack mt={md ? 0 : 30}>
              <button
                type="button"
                className={`${styles.nextBtn} font-face-kg `}
                onClick={() => {
                  InitAMM(
                    base_address,
                    quote_address,
                    parseFloat(base_amount),
                    parseFloat(quote_amount),
                    parseInt(swap_fee),
                    parseInt(short_fraction),
                    parseInt(borrow_cost),
                  );
                }}
              >
                Create
              </button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Center>
  );
};

export default LaunchAMM;

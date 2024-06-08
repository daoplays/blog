import { Dispatch, SetStateAction, useState, MutableRefObject } from "react";
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
import useResponsive from "./hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { toast } from "react-toastify";
import { METAPLEX_META, Extensions, OptionData } from "./state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../common";

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
import ShowExtensions from "./extensions";
import useCreateCollection from "./hooks/useCreateCollection";

const HybridInfo = ({
  option_data,
  setMint,
  setTokenOwner,
}: {
  option_data: MutableRefObject<OptionData>;
  setMint: Dispatch<SetStateAction<Mint>>;
  setTokenOwner: Dispatch<SetStateAction<boolean>>;
}) => {
  const { sm, md, lg } = useResponsive();
  const [token_mint, setTokenMint] = useState<string>("");
  const [token_name, setTokenName] = useState<string>("");
  const [token_icon_url, setTokenIconURL] = useState<string>("");
  const [token_uri, setTokenURI] = useState<string>("");
  const [token_symbol, setTokenSymbol] = useState<string>("");
  const [token_extensions, setTokenExtensions] = useState<number>(0);

  async function setMintData(e): Promise<void> {
    e.preventDefault();

    if (token_mint === "" || !token_mint) {
      toast.error("Please enter token address");
      return;
    }

    let token_key;

    try {
      // Attempt to create a PublicKey instance
      token_key = new PublicKey(token_mint);
      // If no error is thrown, input is a valid public key
    } catch (error) {
      toast.error("Invalid token address");
      return;
    }

    const searchToken = toast.loading("Searching Token...");

    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });
    let result = await connection.getAccountInfo(token_key, "confirmed");

    let mint: Mint;
    if (result.owner.equals(TOKEN_PROGRAM_ID)) {
      try {
        mint = unpackMint(token_key, result, TOKEN_PROGRAM_ID);
        setTokenOwner(false);
        console.log(mint);
      } catch (error) {
        toast.update(searchToken, {
          render: `Error loading token`,
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
        return;
      }
    } else {
      try {
        mint = unpackMint(token_key, result, TOKEN_2022_PROGRAM_ID);
        setTokenOwner(true);
        console.log(mint);
      } catch (error) {
        toast.update(searchToken, {
          render: `Token is not using Token2022 program`,
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
        return;
      }
    }

    setMint(mint);

    let uri = null;
    let metadata_pointer = null;
    if (result.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      // first look for t22 metadata
      metadata_pointer = getMetadataPointerState(mint);
      console.log("metadata pinter:", metadata_pointer);
    }

    if (metadata_pointer !== null) {
      let metadata = await getTokenMetadata(
        connection,
        token_key,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
      );
      console.log(metadata);
      uri = metadata.uri;
      setTokenName(metadata.name);
      setTokenSymbol(metadata.symbol);

      option_data.current.token_name = metadata.name;
      option_data.current.token_symbol = metadata.symbol;
    } else {
      let token_meta_key = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METAPLEX_META.toBuffer(),
          token_key.toBuffer(),
        ],
        METAPLEX_META,
      )[0];
      let raw_meta_data = await connection.getAccountInfo(token_meta_key);

      if (raw_meta_data === null) {
        toast.update(searchToken, {
          render: `Token Metadata Not Found!`,
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
        return;
      }
      let meta_data = Metadata.deserialize(raw_meta_data.data);
      console.log(meta_data);
      console.log(meta_data[0].data.symbol, meta_data[0].data.name);
      uri = meta_data[0].data.uri;
      setTokenName(meta_data[0].data.name);
      setTokenSymbol(meta_data[0].data.symbol);

      option_data.current.token_name = meta_data[0].data.name;
      option_data.current.token_symbol = meta_data[0].data.symbol;
    }

    // check the extensions we care about
    let transfer_hook = getTransferHook(mint);
    let transfer_fee_config = getTransferFeeConfig(mint);
    let permanent_delegate = getPermanentDelegate(mint);

    let extensions =
      (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
      (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
      (Extensions.TransferHook * Number(transfer_hook !== null));
    console.log("extensions", extensions);

    //console.log("deserialize meta data");

    setTokenURI(uri);
    let uri_json = await fetch(uri).then((res) => res.json());
    console.log(uri_json["image"]);
    setTokenIconURL(uri_json["image"]);
    setTokenExtensions(extensions);

    option_data.current.token_uri = uri;
    option_data.current.token_image = uri_json["image"];

    toast.update(searchToken, {
      render: `Successfully found and retrieved token metadata`,
      type: "success",
      isLoading: false,
      autoClose: 2000,
    });
    return;
  }

  function setLaunchData(e) {
    e.preventDefault();
  }

  return (
    <Center width="100%">
      <VStack w="100%" style={{ paddingBottom: md ? 35 : "50px" }}>
        <Text
          align="start"
          className="font-face-kg"
          color={"white"}
          fontSize="x-large"
        >
          Option Info:
        </Text>
        <form
          onSubmit={setLaunchData}
          style={{ width: lg ? "100%" : "1200px" }}
        >
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
                  {token_icon_url ? (
                    <VStack spacing={3}>
                      <img
                        src={token_icon_url}
                        width={lg ? 180 : 235}
                        height={lg ? 180 : 235}
                        alt="Image Frame"
                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                      />
                      <ShowExtensions extension_flag={token_extensions} />
                    </VStack>
                  ) : (
                    <VStack
                      justify="center"
                      align="center"
                      style={{
                        minWidth: lg ? 180 : 235,
                        minHeight: lg ? 180 : 235,
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
                        Token:
                      </div>

                      <div className={styles.textLabelInput}>
                        <Input
                          placeholder="Search Token"
                          size={lg ? "md" : "lg"}
                          required
                          className={styles.inputBox}
                          type="text"
                          value={token_mint}
                          onChange={(e) => {
                            setTokenMint(e.target.value);
                          }}
                        />
                      </div>

                      <div style={{ marginLeft: "12px" }}>
                        <label className={styles.label}>
                          <button
                            onClick={(e) => setMintData(e)}
                            className={styles.browse}
                            style={{ cursor: "pointer", padding: "5px 10px" }}
                          >
                            Search
                          </button>
                        </label>
                      </div>
                    </HStack>
                    <HStack spacing={0} className={styles.eachField}>
                      <div
                        className={`${styles.textLabel} font-face-kg`}
                        style={{ minWidth: lg ? "100px" : "132px" }}
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
                          value={token_name}
                        />
                      </div>
                    </HStack>

                    <Flex
                      gap={sm ? 8 : 5}
                      w="100%"
                      flexDirection={sm ? "column" : "row"}
                    >
                      <HStack spacing={0} className={styles.eachField}>
                        <div
                          className={`${styles.textLabel} font-face-kg`}
                          style={{ minWidth: lg ? "100px" : "132px" }}
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
                            value={token_symbol}
                          />
                        </div>
                      </HStack>
                    </Flex>
                  </VStack>
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Center>
  );
};

export default HybridInfo;

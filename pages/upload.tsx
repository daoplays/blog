import {
    Box,
    Button,
    Divider,
    HStack,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    SimpleGrid,
    Text,
    Textarea,
    Tooltip,
    VStack,
    useDisclosure,
} from "@chakra-ui/react";
import styles from "../styles/Launch.module.css";
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import TwitterIntegration from "../components/common/LinkTwitterAccount";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useResponsive from "../components/blog/apps/commonHooks/useResponsive";
import { Montserrat } from "next/font/google";
import Navigation from "../components/blinkbash/Navigation";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { Config, PROGRAM } from "../components/state/constants";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { WebIrys } from "@irys/sdk";
import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "../components/state/rpc";
import getImageDimensions from "../components/blog/apps/utils/getImageDimension";

require("@solana/wallet-adapter-react-ui/styles.css");

type Tag = {
    name: string;
    value: string;
};

const montserrat = Montserrat({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

export default function Upload() {
    const { xl } = useResponsive();
    const wallet = useWallet();
    const isConnected = wallet.publicKey !== null;

    let today_date = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    const [prompt, setPrompt] = useState<File | null>(null);
    const [startDate, setStartDate] = useState<Date>(new Date((today_date + 1) * (1000 * 60 * 60 * 24)));
    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();


    const handleSetDate = (date : Date) => {
        setStartDate(date);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (!file.type.startsWith("image")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file) {
            if (file.size <= 1048576) {
                const dimensions = await getImageDimensions(file);

                if (dimensions.width === dimensions.height) {
                    setPrompt(file);
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 1MB limit.");
            }
        }
    };

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: "132px" }}>
                Icon:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" onChange={handleFileChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={"lg"}>
                {prompt !== null ? prompt.name : "No File Selected (Size Limit: 3MB)"}
            </Text>
        </HStack>
    );

    const handleUpload = async() => {

        if (prompt === null)
            return;

        const irys_wallet = { name: "phantom", provider: wallet };
        const irys = new WebIrys({
            url: Config.IRYS_URL,
            token: "solana",
            wallet: irys_wallet,
            config: {
                providerUrl: Config.RPC_NODE,
            },
        });
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        toast.info("(1/4) Preparing to upload images - transferring balance to Arweave.");

        let price = await irys.getPrice(Math.floor(prompt.size * 1.2));

        try {
            //await irys.fund(price);

            let txArgs = await get_current_blockhash("");

            var tx = new Transaction(txArgs).add(
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: new PublicKey(Config.IRYS_WALLET),
                    lamports: Number(price),
                }),
            );
            tx.feePayer = wallet.publicKey;
            let signed_transaction = await wallet.signTransaction(tx);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);

            let signature = transaction_response.result;

            let fund_check = await irys.funder.submitFundTransaction(signature);

            console.log(fund_check, fund_check.data["confirmed"]);

            toast.success( "Your account has been successfully funded.");
            
        } catch (error) {

            toast.error("Oops! Something went wrong during funding. Please try again later. ");
            return;
        }

        const tags: Tag[] = [
            { name: "Content-Type", value:prompt.type },
        ];

        const uploadToArweave = toast.info("Sign to upload images on Arweave.");

        let receipt;

        try {
            receipt = await irys.uploadFolder([prompt], {
                //@ts-ignore
                tags,
            });
            toast.update(uploadToArweave, {
                render: `Images have been uploaded successfully!
                View: https://gateway.irys.xyz/${receipt.id}`,
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });
        } catch (error) {

            toast.error(`Failed to upload images, please try again later.`);

            return;
        }

        console.log(receipt);

        let icon_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[prompt.name].id;
        console.log("icon url " + icon_url);

        const message = "Sign to upload Image";
        const encodedMessage = new TextEncoder().encode(message);

        // 2. Sign the message
        const signature = await wallet.signMessage(encodedMessage);
        const encodedSignature = bs58.encode(signature);

        
        let body = JSON.stringify({
            user_key: wallet.publicKey.toString(),
            signature: encodedSignature,
            image_url: icon_url,
            date: startDate.getTime() / 1000 / 60 / 60 / 24
        });
        const response = await fetch("/.netlify/functions/addImage", {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/json",
            },
        });

        //console.log(response)
        toast.success("Image uploaded successfully!");
    }

    
        
    return (
        <>
            <VStack
                zIndex={999}
                className={montserrat.className}
                position="relative"
                justify="center"
                overflowY="auto"
                minHeight="90vh"
                background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)"
            >
                <Navigation />
                <VStack mt={50} h="fit-content" w="1200px" mx={5} p={6} gap={15}>
                    <SimpleGrid w="100%" h={200} columns={1} spacing={15} flexDirection={xl ? "column-reverse" : "row"}>
                        
                        <VStack bg="#0ab7f2" border="1px solid white" p={6} rounded="xl" shadow="xl">
                            <Text m={0} color="white" fontSize="4xl" className="font-face-wc">
                                Prompt Upload
                            </Text>

                            
                        <Popover isOpen={isStartOpen} onClose={onCloseStart} placement="bottom" closeOnBlur={false}>
                        <PopoverTrigger>
                            <HStack spacing={4} color="white" align="center">
                                <HStack onClick={onToggleStart} style={{ cursor: "pointer" }}>
                                    <Text m={0} color="white" className="font-face-kg" fontSize="xl">
                                        {startDate.toLocaleDateString()}
                                    </Text>
                                    <FaCalendarAlt size={28} style={{ marginTop: -2 }} />
                                </HStack>
                                
                            </HStack>
                        </PopoverTrigger>
                        <PopoverContent width="fit-content">
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader h={34} />
                            <PopoverBody>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => {
                                        handleSetDate(date);
                                    }}
                                    onClickOutside={() => onCloseStart()}
                                    inline
                                />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>
                    <Browse />

                        <Button
                            shadow="md"
                            _active={{ bg: "#FFE376" }}
                            _hover={{ opacity: "90%" }}
                            bg="#FFE376"
                            color="#BA6502"
                            rounded="lg"
                            w="full"
                            onClick={() => handleUpload()}
                        >
                            Submit
                        </Button>
                            
                        </VStack>
                    </SimpleGrid>
                </VStack>
                <Image
                    src="/images/man.png"
                    alt="Solana Man Character"
                    width={300}
                    height={300}
                    style={{ position: "absolute", bottom: 0, left: 0, zIndex: -50 }}
                    hidden={xl}
                />
            </VStack>

            

            
        </>
    );
}

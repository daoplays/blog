import {
    Box,
    Button,
    HStack,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Text,
    Textarea,
    VStack,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useState } from "react";
import TwitterIntegration from "../components/common/LinkTwitterAccount";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BiSolidLeftArrow } from "react-icons/bi";
import useAppRoot from "../components/context/useAppRoot";
import useEntry from "../hooks/useEnter";
import Layout from "./layout";
import useResponsive from "../components/blog/apps/commonHooks/useResponsive";

require("@solana/wallet-adapter-react-ui/styles.css");

export default function Home() {
    const { xl } = useResponsive();
    const wallet = useWallet();
    const isConnected = wallet.publicKey !== null;
    const { twitter } = useAppRoot();

    const [startDate, setStartDate] = useState<Date>(new Date());
    const [entry, setEntry] = useState<string>("");

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { handleEntry } = useEntry();

    return (
        <Layout>
            <HStack mt={100} spacing={8} mx={5} flexDirection={xl ? "column-reverse" : "row"}>
                <VStack maxW="600px" justify="center" p={6}>
                    <Text fontSize="2xl" fontWeight={600} color="white">
                        1. Post your caption to the Daily Prompt as a Solana Blink on X (Twitter) to earn $BASH. Finish in the Top 3 for a
                        $BASH payout! <br />
                        <br /> 2. Vote on others’ Blinks to earn $BASH. <br />
                        <br />
                        3. Spend $BASH on rewards sponsored by your favorite Solana projects!
                    </Text>
                </VStack>

                <VStack bg="#0ab7f2" w="500px" border="1px solid white" p={6} rounded="xl" shadow="xl">
                    <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
                        Daily Prompt
                    </Text>

                    <HStack spacing={3}>
                        <Text m="0" color="white" className="font-face-kg">
                            {startDate.toLocaleDateString()}
                        </Text>
                        <Popover isOpen={isStartOpen} onClose={onCloseStart} placement="bottom" closeOnBlur={false}>
                            <PopoverTrigger>
                                <IconButton
                                    size="sm"
                                    color="#BA6502"
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
                                        selected={startDate}
                                        onChange={(date) => {
                                            setStartDate(date);
                                        }}
                                        onClickOutside={() => onCloseStart()}
                                        inline
                                    />
                                </PopoverBody>
                            </PopoverContent>
                        </Popover>
                    </HStack>

                    <HStack>
                        <BiSolidLeftArrow size={28} color="white" style={{ cursor: "pointer" }} />
                        <Box position="relative" h="250px" w="250px" mt={2} border="1px dashed white" rounded="xl">
                            <Image
                                src="/images/prompt.png"
                                width={250}
                                height={250}
                                alt="Image Frame"
                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                            />
                            {/* <HStack
                                bg="white"
                                rounded="lg"
                                p={1}
                                px={2}
                                gap={1}
                                position="absolute"
                                bottom={2}
                                right={2}
                                border="1px solid gray"
                            >
                                <Text m={0} fontSize="xs" fontWeight={600}>
                                    Sponsored By:
                                </Text>
                                <Image src="/images/logo.png" alt="BlinkBlash Logo" width={20} height={20} />
                            </HStack> */}
                        </Box>
                        <BiSolidLeftArrow size={28} color="white" style={{ rotate: "180deg", cursor: "pointer" }} />
                    </HStack>

                    <Textarea
                        mt={3}
                        maxLength={250}
                        placeholder="Enter your Caption Here"
                        color="white"
                        _placeholder={{ color: "gray.300" }}
                        _active={{ border: "1px solid white" }}
                        _focus={{ border: "1px solid white" }}
                        value={entry}
                        onChange={(e) => {
                            setEntry(e.target.value);
                        }}
                    />

                    {twitter && isConnected ? (
                        <Button
                            shadow="md"
                            _active={{ bg: "#FFE376" }}
                            _hover={{ opacity: "90%" }}
                            bg="#FFE376"
                            color="#BA6502"
                            rounded="lg"
                            w="full"
                            onClick={() => handleEntry(wallet.publicKey, 0, entry)}
                        >
                            Submit
                        </Button>
                    ) : (
                        <TwitterIntegration />
                    )}
                </VStack>
            </HStack>
        </Layout>
    );
}

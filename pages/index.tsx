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
import { LuCrown } from "react-icons/lu";
import { EffectCards, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import { Montserrat } from "next/font/google";
require("@solana/wallet-adapter-react-ui/styles.css");

const submittedCaptions = [
    {
        pfp: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        username: "@CuriousKitty99",
        displayName: "Catventurer",
        Caption: "My Solana meowster just found the comfiest metaverse nap spot! #felinelife #SolanaCatNFT",
    },
    {
        pfp: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        username: "@StarryEyedGazer",
        displayName: "Amelia",
        Caption: "Lost in the beauty of the cosmos tonight with my cosmic cat NFT. ✨ #astronomylover #SolanaCatNFT #tothemoon",
    },
    {
        pfp: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        username: "@VinylVibes78",
        displayName: "The Spin Doctor",
        Caption: "My Solana cat NFT gets it. Vinyl vibes are the best vibes.  #recordcollector #oldschoolmusic #SolanaCatNFT",
    },
    {
        pfp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        username: "@TheAdventureSquad",
        displayName: "The Misfits",
        Caption: "Making metaverse memories with my Solana cat NFT and the squad! #friendshipgoals #alwayslaughing #SolanaCatNFT #Solana",
    },
    {
        pfp: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        username: "@CaffeinatedCoder",
        displayName: "Java Junkie ☕",
        Caption:
            "Coffee in hand, code flowing, cat NFT chilling. Another day in the Solanaverse! #coffeelover #programmerlife #SolanaCatNFT",
    },
];

const winners = [
    { rank: "Rank 1 - 500 $BASH", color: "#FFD700", text: "You | Claim Prize" },
    {
        rank: "Rank 2 - 250 $BASH",
        color: "#C2C2C2",
        text: "Catventurer",
        img: "/images/prompt.png",
    },
    {
        rank: "Rank 3 - 100 $BASH",
        color: "#D3802E",
        text: "VynilVibes",
        img: "/images/prompt.png",
    },
];

const montserrat = Montserrat({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

export default function Home() {
    const { xl } = useResponsive();
    const wallet = useWallet();
    const isConnected = wallet.publicKey !== null;
    const { twitter } = useAppRoot();

    const [startDate, setStartDate] = useState<Date>(new Date());
    const [entry, setEntry] = useState<string>("");

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { handleEntry } = useEntry();

    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '" >' + "</span>";
        },
    };

    return (
        <>
            <Layout>
                <VStack mt={50} h="fit-content" w="1200px" mx={5} p={6} gap={6}>
                    <SimpleGrid w="100%" h={600} columns={2} spacing={5} flexDirection={xl ? "column-reverse" : "row"}>
                        <VStack spacing={1} background="rgba(0,0,0,0.20)" p={6} rounded="xl" overflowY="auto">
                            <Text m={0} fontSize="xl" fontWeight={600} color="white">
                                1. Post your caption to the Daily Prompt as a Solana Blink on X (Twitter) to earn $BASH. Finish in the Top 3
                                for a $BASH payout! <br />
                                <br /> 2. Vote on others’ Blinks to earn $BASH. <br />
                                <br />
                                3. Spend $BASH on rewards sponsored by your favorite Solana projects!
                            </Text>

                            <Divider />

                            <Text mb={1} color="white" fontSize="3xl" className="font-face-wc">
                                Submitted Captions
                            </Text>

                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                <Swiper
                                    loop={true}
                                    slidesPerView={1}
                                    spaceBetween={10}
                                    navigation={true}
                                    speed={1000}
                                    pagination={pagination}
                                    modules={[Pagination]}
                                    autoplay={{
                                        delay: 3000,
                                    }}
                                    style={{
                                        height: "100%",
                                    }}
                                    className="swiper-container"
                                >
                                    {submittedCaptions.map(({ pfp, displayName, username, Caption }, i) => {
                                        return (
                                            <SwiperSlide key={username} style={{ height: "100%" }}>
                                                <VStack h="100%" bg="#0ab7f2" border="1px solid white" p={6} rounded="xl" shadow="xl">
                                                    <HStack w="full" alignItems="start" justifyContent="space-between">
                                                        <HStack alignItems="center" gap={4}>
                                                            <div
                                                                style={{
                                                                    width: "60px",
                                                                    height: "60px",
                                                                    position: "relative",
                                                                    borderRadius: "100%",
                                                                }}
                                                            >
                                                                <Image
                                                                    src={pfp}
                                                                    alt={`${displayName}'s PFP`}
                                                                    fill
                                                                    style={{
                                                                        objectFit: "cover",
                                                                        borderRadius: "100%",
                                                                    }}
                                                                />
                                                            </div>

                                                            <VStack alignItems="start" gap={0} color="white">
                                                                <Text m={0} fontSize="xl" fontWeight={600}>
                                                                    {displayName}
                                                                </Text>
                                                                <Text m={0} fontSize="sm">
                                                                    {username}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>

                                                        <HStack mt={2} gap={3} style={{ cursor: "pointer" }}>
                                                            <Tooltip label="Upvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                                <Image
                                                                    onClick={() => {}}
                                                                    src="/images/thumbs-up.svg"
                                                                    width={35}
                                                                    height={35}
                                                                    alt="Thumbs Up"
                                                                />
                                                            </Tooltip>

                                                            <Tooltip label="Downvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                                <Image
                                                                    onClick={() => {}}
                                                                    src="/images/thumbs-down.svg"
                                                                    width={35}
                                                                    height={35}
                                                                    alt="Thumbs Down"
                                                                />
                                                            </Tooltip>
                                                        </HStack>
                                                    </HStack>

                                                    <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                                        {Caption}
                                                    </Text>
                                                </VStack>
                                            </SwiperSlide>
                                        );
                                    })}
                                </Swiper>
                            </div>
                        </VStack>
                        <VStack bg="#0ab7f2" border="1px solid white" p={6} rounded="xl" shadow="xl">
                            <Text m={0} color="white" fontSize="4xl" className="font-face-wc">
                                Daily Prompt
                            </Text>

                            <HStack>
                                <Box position="relative" h="300px" w="300px" border="1px dashed white" rounded="xl">
                                    <Image
                                        src="/images/prompt.png"
                                        width={300}
                                        height={300}
                                        alt="Image Frame"
                                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                                    />
                                </Box>
                            </HStack>

                            <Textarea
                                mt={2}
                                maxLength={250}
                                rows={5}
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
                    </SimpleGrid>
                </VStack>
            </Layout>
            <VStack justifyContent="center" h={75} bg="linear-gradient(180deg, #FFBC0F 49.61%, #B76300 100%)">
                <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
                    Past Winners
                </Text>
            </VStack>

            <VStack className={montserrat.className} background="linear-gradient(180deg, #0076CC 100%, #5DBBFF 0%)">
                <VStack gap={4} mt={50}>
                    {submittedCaptions.map(({ pfp, displayName, username, Caption }, i) => (
                        <VStack w="1150px" key={username}>
                            <SimpleGrid w="full" gap={2} columns={3}>
                                {winners.map(({ rank, color, text, img }) => (
                                    <VStack gap={1} background="rgba(0,0,0,0.20)" px={6} py={4} rounded="xl" key={rank}>
                                        <HStack color={color} fontSize="xl" fontWeight={600}>
                                            <LuCrown size={26} />
                                            <Text m={0}>{rank}</Text>
                                        </HStack>
                                        <HStack>
                                            {img && (
                                                <Box position="relative" h="30px" w="30px" rounded="full">
                                                    <Image
                                                        src={img}
                                                        width={30}
                                                        height={30}
                                                        alt="Image Frame"
                                                        style={{
                                                            backgroundSize: "cover",
                                                            borderRadius: "100%",
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            <Text m={0} color="white" fontWeight={500} fontSize="lg">
                                                {text}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                ))}
                            </SimpleGrid>

                            <HStack w="full" gap={2}>
                                <Box position="relative" minH="200px" minW="200px" border="1px solid white" rounded="xl">
                                    <Image
                                        src="/images/prompt.png"
                                        fill
                                        alt="Image Frame"
                                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                                    />
                                </Box>
                                <HStack
                                    h={200}
                                    w="full"
                                    bg="#0ab7f2"
                                    border="1px solid white"
                                    rounded="xl"
                                    shadow="xl"
                                    alignItems="start"
                                    overflowY="auto"
                                >
                                    <VStack p={6} w="full" alignItems="start">
                                        <HStack w="full" justifyContent="space-between">
                                            <HStack alignItems="start" gap={4}>
                                                <Box position="relative" w="60px" h="60px" borderRadius="100%">
                                                    <Image
                                                        src={pfp}
                                                        alt={`${displayName}'s PFP`}
                                                        fill
                                                        style={{
                                                            objectFit: "cover",
                                                            borderRadius: "100%",
                                                        }}
                                                    />
                                                </Box>
                                                <VStack alignItems="start" gap={0} color="white">
                                                    <Text m={0} fontSize="xl" fontWeight={600}>
                                                        {displayName}
                                                    </Text>
                                                    <Text m={0}>{username}</Text>
                                                </VStack>
                                            </HStack>
                                            <HStack gap={3} mt={-2}>
                                                <HStack gap={1}>
                                                    <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                                        Votes:
                                                    </Text>
                                                    <Text m={0} fontSize="lg" fontWeight={600} color="#FFD700">
                                                        895
                                                    </Text>
                                                </HStack>

                                                <Divider orientation="vertical" h={6} />

                                                <Button
                                                    shadow="md"
                                                    _active={{ bg: "#FFE376" }}
                                                    _hover={{ opacity: "90%" }}
                                                    bg="#FFE376"
                                                    color="#BA6502"
                                                    rounded="lg"
                                                    w="full"
                                                >
                                                    View Blink
                                                </Button>
                                            </HStack>
                                        </HStack>
                                        <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                            {Caption}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </HStack>
                            <Divider />
                        </VStack>
                    ))}
                </VStack>
            </VStack>
        </>
    );
}

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
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import TwitterIntegration from "../components/common/LinkTwitterAccount";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaRetweet } from "react-icons/fa6";
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
import Navigation from "../components/blinkbash/Navigation";
import { DayRow, TwitterUser } from "../components/state/interfaces";
import { EntryData, LeaderboardData } from "../components/state/state";
import { getDatabase, ref, get, Database } from "firebase/database";
import { PublicKey } from "@solana/web3.js";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { PROGRAM } from "../components/state/constants";
import useVote from "../hooks/useVote";
import { wrapLongWords } from "../components/state/utils";
import { TbReload } from "react-icons/tb";
import { BiSolidLeftArrow } from "react-icons/bi";

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
    { rank: 1, reward: "500 $BASH", color: "#FFD700", winner: "You" },
    {
        rank: 2,
        reward: "250 $BASH",
        color: "#C2C2C2",
        winner: "Catventurer",
        img: "/images/prompt.png",
    },
    {
        rank: 3,
        reward: "100 $BASH",
        color: "#D3802E",
        winner: "VynilVibes",
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

export const GetDaysEntries = async (
    date: number,
    database: Database,
    entryList: Map<string, EntryData>,
    twitterList: Map<string, TwitterUser>,
    setDayRows: Dispatch<SetStateAction<DayRow[]>>,
) => {
    if (database === null || entryList === null || twitterList === null) {
        setDayRows([]);
        return;
    }

    // get the listings
    const entries_db = await get(ref(database, "BlinkBash/entries/0/" + date));
    let entries = entries_db.val();
    if (entries === null) {
        setDayRows([]);
        return;
    }

    let day_rows: DayRow[] = [];
    Object.entries(entries).forEach(([key, value]) => {
        let json = JSON.parse(value.toString());
        let creator = new PublicKey(key);
        let entry_account = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)], PROGRAM)[0];
        let entry = entryList.get(entry_account.toString());
        let twitter = twitterList.get(key);
        if (entry === undefined || twitter === undefined) {
            console.log("ENTRY");
            console.log(key, json);
            console.log(entry);

            return;
        }

        let row: DayRow = {
            key: key,
            twitter: twitter,
            score: entry.positive_votes - entry.negative_votes,
            link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
            entry: json.entry,
        };

        day_rows.push(row);
    });
    const sortedList = [...day_rows].sort((a, b) => b.score - a.score);

    setDayRows(sortedList);
};

export const GetDaysWinners = async (
    date: number,
    database: Database,
    entryList: Map<string, EntryData>,
    userIDs: Map<number, string>,
    leaderboardList: Map<string, LeaderboardData>,
    twitterList: Map<string, TwitterUser>,
    setDayRows: Dispatch<SetStateAction<DayRow[]>>,
) => {
    if (database === null || entryList === null || twitterList === null || userIDs === null) {
        setDayRows([]);
        return;
    }

    // get the listings
    const entries_db = await get(ref(database, "BlinkBash/entries/0/" + date));
    let entries = entries_db.val();
    if (entries === null) {
        setDayRows([]);
        return;
    }
    let leaderboard_account = PublicKey.findProgramAddressSync(
        [uInt8ToLEBytes(0), uInt32ToLEBytes(date), Buffer.from("Leaderboard")],
        PROGRAM,
    )[0];

    let leaderboard = leaderboardList.get(leaderboard_account.toString());

    if (leaderboard === undefined) {
        setDayRows([]);
        return;
    }

    console.log(leaderboard);

    if (leaderboard.scores.length === 0) {
        setDayRows([]);
        return;
    }

    // Sort the indices based on scores (in descending order)
    const indices = Array.from(leaderboard.scores.keys());

    // Sort the indices based on scores (in descending order)
    indices.sort((a, b) => leaderboard.scores[b] - leaderboard.scores[a]);

    // Use the sorted indices to reorder the entrants
    const sortedEntrants = indices.map((i) => leaderboard.entrants[i]);

    let day_rows: DayRow[] = [];

    let max_index = Math.min(3, sortedEntrants.length);
    for (let i = 0; i < max_index; i++) {
        let key = userIDs.get(sortedEntrants[i]);
        let json = JSON.parse(entries[key].toString());

        let creator = new PublicKey(key);
        let entry_account = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)], PROGRAM)[0];
        let entry = entryList.get(entry_account.toString());
        let twitter = twitterList.get(key);
        if (entry === null || twitter === null) {
            return;
        }

        let row: DayRow = {
            key: key,
            twitter: twitter,
            score: entry.positive_votes - entry.negative_votes,
            link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
            entry: json.entry,
        };

        day_rows.push(row);
    }
    console.log(day_rows);
    setDayRows(day_rows);
};

export default function Home() {
    const { xl } = useResponsive();
    const wallet = useWallet();

    const isConnected = wallet.publicKey !== null;
    const { twitter, database, userIDs, entryList, twitterList, leaderboardList } = useAppRoot();

    const [selectedRank, setSelectedRank] = useState(1);

    const [startDate, setStartDate] = useState<Date>(new Date());
    const [entry, setEntry] = useState<string>("");
    const [entries, setEntries] = useState<DayRow[]>([]);
    const [day_winners, setWinners] = useState<DayRow[]>([]);
    const [random_entry, setRandomEntry] = useState<number>(0);

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { handleEntry } = useEntry();

    const handlePreviousDay = () => {
        const newDate = new Date(startDate.getTime() - 1000 * 60 * 60 * 24);
        setStartDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24);
        setStartDate(newDate);
    };
    const { Vote } = useVote();

    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '" >' + "</span>";
        },
    };

    // get todays entries on load
    useEffect(() => {
        if (database === null || entryList === null || twitterList === null || leaderboardList === null) {
            return;
        }

        console.log("date", new Date(), new Date().getTime(), Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)));
        GetDaysEntries(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)), database, entryList, twitterList, setEntries);
        GetDaysWinners(
            Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)),
            database,
            entryList,
            userIDs,
            leaderboardList,
            twitterList,
            setWinners,
        );
    }, [database, entryList, twitterList]);

    useEffect(() => {
        if (entries.length === 0) {
            return;
        }

        setRandomEntry(0);
    }, [entries]);

    const handleRandomiseEntry = () => {
        if (entries.length === 0) {
            return;
        }

        if (entries.length === 1) {
            setRandomEntry(0);
            return;
        }

        let random_index = Math.floor(Math.random() * entries.length);
        while (random_index === random_entry) {
            random_index = Math.floor(Math.random() * entries.length);
        }
        console.log(random_index);
        setRandomEntry(random_index);
    };

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

                            <HStack mb={1} alignItems="center">
                                <Text mb={0} color="white" fontSize="3xl" className="font-face-wc">
                                    Submitted Captions{" "}
                                </Text>

                                <Tooltip label="Randomise" hasArrow fontSize="large" offset={[0, 15]}>
                                    <div>
                                        <TbReload
                                            size={32}
                                            onClick={() => handleRandomiseEntry()}
                                            color="white"
                                            style={{ marginTop: -6, cursor: "pointer" }}
                                        />
                                    </div>
                                </Tooltip>
                            </HStack>

                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                {entries.length > 0 && (
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
                                                        src={entries[random_entry].twitter.profile_image_url}
                                                        alt={`${entries[random_entry].twitter.username}'s PFP`}
                                                        fill
                                                        style={{
                                                            objectFit: "cover",
                                                            borderRadius: "100%",
                                                        }}
                                                    />
                                                </div>

                                                <VStack alignItems="start" gap={0} color="white">
                                                    <Text m={0} fontSize="xl" fontWeight={600}>
                                                        {entries[random_entry].twitter.name}
                                                    </Text>
                                                    <Text m={0} fontSize="sm">
                                                        {entries[random_entry].twitter.username}
                                                    </Text>
                                                </VStack>
                                            </HStack>

                                            <HStack alignItems="start" mt={2} gap={3} style={{ cursor: "pointer" }}>
                                                <Tooltip label="Retweet" hasArrow fontSize="large" offset={[0, 15]}>
                                                    <div>
                                                        <FaRetweet
                                                            size={42}
                                                            color="rgba(0,0,0,0.45)"
                                                            onClick={() => {}}
                                                            style={{ marginTop: -2 }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                                <Tooltip label="Upvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                    <Image
                                                        onClick={() => Vote(new PublicKey(entries[random_entry].key), 0, 1)}
                                                        src="/images/thumbs-up.svg"
                                                        width={35}
                                                        height={35}
                                                        alt="Thumbs Up"
                                                    />
                                                </Tooltip>

                                                <Tooltip label="Downvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                    <Image
                                                        onClick={() => Vote(new PublicKey(entries[random_entry].key), 0, 2)}
                                                        src="/images/thumbs-down.svg"
                                                        width={35}
                                                        height={35}
                                                        alt="Thumbs Down"
                                                    />
                                                </Tooltip>
                                            </HStack>
                                        </HStack>

                                        <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                            {wrapLongWords(entries[random_entry].entry)}
                                        </Text>
                                    </VStack>
                                )}
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
                <Image
                    src="/images/man.png"
                    alt="Solana Man Character"
                    width={300}
                    height={300}
                    style={{ position: "absolute", bottom: 0, left: 0, zIndex: -50 }}
                    hidden={xl}
                />
            </VStack>

            <VStack justifyContent="center" h={75} bg="linear-gradient(180deg, #FFBC0F 49.61%, #B76300 100%)">
                <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
                    Past Winners
                </Text>
            </VStack>

            <VStack className={montserrat.className} background="linear-gradient(180deg, #0076CC 100%, #5DBBFF 0%)">
                <VStack gap={10} mt={35} mb={50}>
                    <Popover isOpen={isStartOpen} onClose={onCloseStart} placement="bottom" closeOnBlur={false}>
                        <PopoverTrigger>
                            <HStack spacing={4} color="white" align="center">
                                <BiSolidLeftArrow size={28} color="white" style={{ cursor: "pointer" }} onClick={handlePreviousDay} />
                                <HStack onClick={onToggleStart} style={{ cursor: "pointer" }}>
                                    <Text m={0} color="white" className="font-face-kg" fontSize="xl">
                                        {startDate.toLocaleDateString()}
                                    </Text>
                                    <FaCalendarAlt size={28} style={{ marginTop: -2 }} />
                                </HStack>
                                <BiSolidLeftArrow
                                    size={28}
                                    color="white"
                                    style={{ rotate: "180deg", cursor: "pointer" }}
                                    onClick={handleNextDay}
                                />
                            </HStack>
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

                    <VStack w="1150px">
                        <SimpleGrid w="full" gap={2} columns={3}>
                            {winners.map(({ rank, color, winner, img, reward }) => (
                                <VStack
                                    gap={1}
                                    background={selectedRank === rank ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.20)"}
                                    _hover={{ background: `rgba(0,0,0,0.35)` }}
                                    px={6}
                                    py={4}
                                    rounded="xl"
                                    key={rank}
                                    cursor="pointer"
                                    onClick={() => setSelectedRank(rank)}
                                >
                                    <HStack color={color} fontSize="xl" fontWeight={600}>
                                        <LuCrown size={26} />
                                        <Text m={0}>
                                            Rank {rank} - {reward}
                                        </Text>
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
                                            {winner} {winner === "You" && "| "}
                                            {winner === "You" && (
                                                <Text
                                                    m={0}
                                                    as="span"
                                                    _hover={{ textDecoration: "underline" }}
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    Claim Prize
                                                </Text>
                                            )}
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
                                                    src={
                                                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fm=jpg&w=3000&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                                    }
                                                    alt={`PFP`}
                                                    fill
                                                    style={{
                                                        objectFit: "cover",
                                                        borderRadius: "100%",
                                                    }}
                                                />
                                            </Box>
                                            <VStack alignItems="start" gap={0} color="white">
                                                <Text m={0} fontSize="xl" fontWeight={600}>
                                                    Catventurer
                                                </Text>
                                                <Text m={0}>@CuriousKitty99</Text>
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
                                        My Solana meowster just found the comfiest metaverse nap spot! #felinelife #SolanaCatNFT
                                    </Text>
                                </VStack>
                            </HStack>
                        </HStack>
                        <Divider />
                    </VStack>
                </VStack>
            </VStack>
        </>
    );
}

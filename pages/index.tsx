import {
    Box,
    Button,
    Divider,
    HStack,
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
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
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
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import { Montserrat } from "next/font/google";
import Navigation from "../components/blinkbash/Navigation";
import { DayRow, TwitterUser, default_twitter } from "../components/state/interfaces";
import { EntryData, LeaderboardData } from "../components/state/state";
import { getDatabase, ref, get, Database } from "firebase/database";
import { PublicKey } from "@solana/web3.js";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { PROGRAM } from "../components/state/constants";
import useVote from "../hooks/useVote";
import useClaimPrize from "../hooks/useClaimPrize";
import { wrapLongWords } from "../components/state/utils";
import { TbReload } from "react-icons/tb";
import { BiSolidLeftArrow } from "react-icons/bi";
import bs58 from "bs58";
import { toast } from "react-toastify";
import Link from "next/link";

require("@solana/wallet-adapter-react-ui/styles.css");

const rewards = ["500 $BASH", "250 $BASH", "100 $BASH"];
const colours = ["#FFD700", "#C2C2C2", "#D3802E"];

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

    const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + date));
    let prompt_val = prompt_db.val();

    if (prompt_val === null) {
        setDayRows([]);
        return;
    }
    let json = JSON.parse(prompt_val.toString());
    let prompt_url = json["url"];

    let day_rows: DayRow[] = [];
    Object.entries(entries).forEach(([key, value]) => {
        let json = JSON.parse(value.toString());
        let creator = new PublicKey(key);
        let entry_account = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)], PROGRAM)[0];
        let entry = entryList.get(entry_account.toString());
        let twitter = twitterList.get(key);
        if (entry === undefined) {
            return;
        }

        if (twitter === undefined) {
            twitter = default_twitter;
        }

        let row: DayRow = {
            key: key,
            twitter: twitter,
            score: entry.positive_votes - entry.negative_votes,
            link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
            entry: json.entry,
            prompt: prompt_url,
            claimed: entry.reward_claimed === 1,
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

    if (leaderboard.scores.length === 0) {
        setDayRows([]);
        return;
    }

    const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + date));
    let prompt_val = prompt_db.val();

    if (prompt_val === null) {
        setDayRows([]);
        return;
    }
    let json = JSON.parse(prompt_val.toString());
    let prompt_url = json["url"];
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
        if (entry === null) {
            return;
        }

        if (twitter === undefined) {
            twitter = default_twitter;
        }

        if (entry.positive_votes + entry.negative_votes === 0) {
            // skip if no votes
            continue;
        }

        let row: DayRow = {
            key: key,
            twitter: twitter,
            score: entry.positive_votes - entry.negative_votes,
            link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
            entry: json.entry,
            prompt: prompt_url,
            claimed: entry.reward_claimed === 1,
        };

        day_rows.push(row);
    }
    //console.log(day_rows);
    setDayRows(day_rows);
};

export default function Home() {
    const { sm, md, lg, xl } = useResponsive();
    const wallet = useWallet();

    const isConnected = wallet.publicKey !== null;
    let today_date = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));

    const { twitter, database, userIDs, entryList, twitterList, leaderboardList } = useAppRoot();

    const [selectedRank, setSelectedRank] = useState(0);

    const [startDate, setStartDate] = useState<Date>(new Date((today_date - 1) * (1000 * 60 * 60 * 24)));
    const [entry, setEntry] = useState<string>("");
    const [entries, setEntries] = useState<DayRow[]>([]);
    const [day_winners, setWinners] = useState<DayRow[]>([]);
    const [random_entry, setRandomEntry] = useState<number>(0);
    const [winner_date, setWinnerDate] = useState<number>(today_date - 1);
    const [prompt, setPrompt] = useState<string>("");

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { handleEntry } = useEntry();
    const { ClaimPrize } = useClaimPrize();

    const handleSetDate = (date: Date) => {
        setSelectedRank(0);
        setStartDate(date);
        let day = date.getTime() / 1000 / 60 / 60 / 24;
        setWinnerDate(day);
        console.log(date, day);
    };

    const handlePreviousDay = () => {
        let min_win_date = 19907;
        if (winner_date === min_win_date) {
            return;
        }
        let new_date_time = (winner_date - 1) * 1000 * 60 * 60 * 24;

        const newDate = new Date(new_date_time);
        setSelectedRank(0);
        setStartDate(newDate);
        setWinnerDate(winner_date - 1);
    };

    const handleNextDay = () => {
        if (winner_date === today_date - 1) {
            return;
        }
        let new_date_time = (winner_date + 1) * 1000 * 60 * 60 * 24;
        const newDate = new Date(new_date_time);
        setSelectedRank(0);
        setStartDate(newDate);
        setWinnerDate(winner_date + 1);
    };
    const { Vote } = useVote();

    // get todays entries on load

    useEffect(() => {
        if (database === null || entryList === null || twitterList === null || leaderboardList === null) {
            return;
        }

        GetDaysEntries(today_date, database, entryList, twitterList, setEntries);
        GetDaysWinners(winner_date, database, entryList, userIDs, leaderboardList, twitterList, setWinners);
    }, [today_date, winner_date, database, entryList, twitterList, leaderboardList, userIDs]);

    useEffect(() => {
        if (entries.length === 0) {
            return;
        }

        setRandomEntry(0);
    }, [entries]);

    // set the prompt

    const getPrompt = useCallback(async () => {
        if (database === null) {
            return;
        }
        const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + today_date));
        let prompt_val = prompt_db.val();
        if (prompt_val === null) {
            setPrompt("https://blinkbash.daoplays.org/api/errorImage");
            return;
        }
        let json = JSON.parse(prompt_val.toString());
        console.log("prompt", today_date, json["url"]);
        setPrompt(json["url"]);
    }, [database, today_date]);

    useEffect(() => {
        if (prompt !== "") {
            return;
        }

        getPrompt();
    }, [prompt, getPrompt]);

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
        setRandomEntry(random_index);
    };

    const shareEntry = useCallback(
        async (creator: string, date: number) => {
            try {
                const message = "Sign to share post on X";
                const encodedMessage = new TextEncoder().encode(message);

                // 2. Sign the message
                const signature = await wallet.signMessage(encodedMessage);
                const encodedSignature = bs58.encode(signature);

                let link = "https://blinkbash.daoplays.org/api/blink?creator=" + creator + "&game=0&date=" + date;
                let dial_link = "https://dial.to/?action=solana-action:" + encodeURIComponent(link);

                let tweet = "Check out this entry to BlinkBash! " + dial_link;

                let body = JSON.stringify({
                    user_key: wallet.publicKey.toString(),
                    signature: encodedSignature,
                    tweetContent: tweet,
                });
                const response = await fetch("/.netlify/functions/shareEntry", {
                    method: "POST",
                    body: body,
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                //console.log(response)
                toast.success("Tweet shared successfully!");
            } catch (error) {
                console.log("Error fetching user info:", error);
                toast.error("Error sharing tweet");
            }
        },
        [wallet],
    );

    return (
        <>
            <VStack
                zIndex={999}
                className={montserrat.className}
                position="relative"
                justify={!md && "center"}
                h={md ? "fit-content" : "90vh"}
                pb={3}
                background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)"
            >
                <Navigation />
                <SimpleGrid mt={85} maxW="1200px" mx={md ? 0 : 5} p={6} gap={6} h="fit-content" w="100%" columns={md ? 1 : 2} spacing={5}>
                    <VStack h={md ? 600 : ""} spacing={1} background="rgba(0,0,0,0.20)" p={6} rounded="xl" overflowY="auto">
                        <Text m={0} fontSize={md ? "lg" : "xl"} fontWeight={600} color="white">
                            1. Post your caption to the Daily Prompt as a Solana Blink on X (Twitter) to earn $BASH. Finish in the Top 3 for
                            a $BASH payout! <br />
                            <br /> 2. Vote on others’ Blinks to earn $BASH. <br />
                            <br />
                            3. Spend $BASH on rewards sponsored by your favorite Solana projects!
                        </Text>

                        <Divider />

                        <HStack mb={1} alignItems="center">
                            <Text mb={0} color="white" fontSize={sm ? "xl" : "3xl"} className="font-face-wc">
                                Submitted Captions{" "}
                            </Text>

                            <Tooltip label="Randomise" hasArrow fontSize="large" offset={[0, 15]}>
                                <div>
                                    <TbReload
                                        size={md ? 25 : 32}
                                        onClick={() => handleRandomiseEntry()}
                                        color="white"
                                        style={{ marginTop: md ? -3 : -6, cursor: "pointer" }}
                                    />
                                </div>
                            </Tooltip>
                        </HStack>

                        <div style={{ width: "100%", height: "100%", position: "relative" }}>
                            {entries.length > 0 ? (
                                <VStack h="100%" bg="#0ab7f2" border="1px solid white" p={6} rounded="xl" shadow="xl">
                                    <HStack w="full" alignItems="start" justifyContent="space-between">
                                        <HStack alignItems="center" gap={2}>
                                            <Link href={`https://x.com/${entries[random_entry].twitter.username}`} target="_blank">
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
                                            </Link>

                                            <VStack alignItems="start" gap={0} color="white">
                                                <Text m={0} fontSize="xl" fontWeight={600}>
                                                    {entries[random_entry].twitter.name}
                                                </Text>
                                                <Text m={0} fontSize="sm">
                                                    @{entries[random_entry].twitter.username}
                                                </Text>
                                            </VStack>
                                        </HStack>

                                        <HStack alignItems="start" mt={2} gap={3} style={{ cursor: "pointer" }}>
                                            <Tooltip label="Retweet" hasArrow fontSize="large" offset={[0, 15]}>
                                                <div>
                                                    <FaRetweet
                                                        size={sm ? 30 : 42}
                                                        color="rgba(0,0,0,0.45)"
                                                        onClick={() => shareEntry(entries[random_entry].key, today_date)}
                                                        style={{ marginTop: -2 }}
                                                    />
                                                </div>
                                            </Tooltip>
                                            <Tooltip label="Upvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                <Image
                                                    onClick={() => Vote(new PublicKey(entries[random_entry].key), 0, 1)}
                                                    src="/images/thumbs-up.svg"
                                                    width={sm ? 25 : 35}
                                                    height={sm ? 25 : 35}
                                                    alt="Thumbs Up"
                                                />
                                            </Tooltip>

                                            <Tooltip label="Downvote" hasArrow fontSize="large" offset={[0, 15]}>
                                                <Image
                                                    onClick={() => Vote(new PublicKey(entries[random_entry].key), 0, 2)}
                                                    src="/images/thumbs-down.svg"
                                                    width={sm ? 25 : 35}
                                                    height={sm ? 25 : 35}
                                                    alt="Thumbs Down"
                                                />
                                            </Tooltip>
                                        </HStack>
                                    </HStack>
                                    <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                        {wrapLongWords(entries[random_entry].entry)}
                                    </Text>
                                </VStack>
                            ) : (
                                <VStack h="100%" alignItems="center" justifyContent="center">
                                    <Text mb={0} color="white" fontWeight={500} fontSize={md ? "lg" : "xl"} opacity="50%" mt={-12}>
                                        No Entries Yet.
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
                                    src={prompt}
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
                <Image
                    src="/images/man.png"
                    alt="Solana Man Character"
                    width={300}
                    height={300}
                    style={{ position: "absolute", bottom: 0, left: 0, zIndex: -50 }}
                    hidden={xl}
                />
            </VStack>

            <VStack justifyContent="center" h={75} bg="linear-gradient(180deg, #FFBC0F 49.61%, #B76300 100%)" hidden={md}>
                <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
                    Past Winners
                </Text>
            </VStack>

            <VStack
                pt={md ? 45 : 0}
                px={10}
                className={montserrat.className}
                background="linear-gradient(180deg, #0076CC 100%, #5DBBFF 0%)"
            >
                <Text m={0} color="white" fontSize={sm ? "4xl" : "5xl"} className="font-face-wc" hidden={!md}>
                    Past Winners
                </Text>

                <VStack gap={10} mt={35} mb={50}>
                    <Popover isOpen={isStartOpen} onClose={onCloseStart} placement="bottom" closeOnBlur={false}>
                        <PopoverTrigger>
                            <HStack mt={md && -5} spacing={4} color="white" align="center">
                                <BiSolidLeftArrow
                                    size={sm ? 24 : 28}
                                    color="white"
                                    style={{ cursor: "pointer" }}
                                    onClick={handlePreviousDay}
                                />
                                <HStack onClick={onToggleStart} style={{ cursor: "pointer" }}>
                                    <Text m={0} color="white" className="font-face-kg" fontSize={sm ? "lg" : "xl"}>
                                        {startDate.toLocaleDateString()}
                                    </Text>
                                    <FaCalendarAlt size={sm ? 24 : 28} style={{ marginTop: -2 }} />
                                </HStack>
                                <BiSolidLeftArrow
                                    size={sm ? 24 : 28}
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
                                    minDate={new Date(19907 * 1000 * 60 * 60 * 24)}
                                    maxDate={new Date((today_date - 1) * 1000 * 60 * 60 * 24)}
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

                    <VStack w={xl ? "full" : "1150px"}>
                        <SimpleGrid w="full" gap={2} columns={sm ? 1 : day_winners.length}>
                            {day_winners.map((entry, index) => (
                                <VStack
                                    gap={1}
                                    background={selectedRank === index ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.20)"}
                                    _hover={{ background: `rgba(0,0,0,0.35)` }}
                                    px={6}
                                    py={4}
                                    rounded="xl"
                                    key={index}
                                    cursor="pointer"
                                    onClick={() => setSelectedRank(index)}
                                >
                                    <HStack color={colours[index]} fontSize="xl" fontWeight={600}>
                                        <LuCrown size={26} />
                                        <Text m={0}>
                                            Rank {index + 1} - {rewards[index]}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Box position="relative" h="30px" w="30px" rounded="full">
                                            <Image
                                                src={entry.twitter.profile_image_url}
                                                width={30}
                                                height={30}
                                                alt="Image Frame"
                                                style={{
                                                    backgroundSize: "cover",
                                                    borderRadius: "100%",
                                                }}
                                            />
                                        </Box>

                                        <Text m={0} color="white" fontWeight={500} fontSize="lg">
                                            {entry.twitter.name}{" "}
                                            {wallet !== null &&
                                                wallet.publicKey !== null &&
                                                entry.key === wallet.publicKey.toString() &&
                                                "| "}
                                            {wallet !== null && wallet.publicKey !== null && entry.key === wallet.publicKey.toString() && (
                                                <Text
                                                    m={0}
                                                    as="span"
                                                    _hover={{ textDecoration: entry.claimed ? "none" : "underline" }}
                                                    onClick={() => (entry.claimed ? "" : ClaimPrize(0, today_date - 1))}
                                                >
                                                    {!entry.claimed ? "Claim Prize" : "Claimed"}
                                                </Text>
                                            )}
                                        </Text>
                                    </HStack>
                                </VStack>
                            ))}
                        </SimpleGrid>

                        {day_winners.length > 0 && (
                            <HStack w="full" gap={2}>
                                <Box position="relative" minH="200px" minW="200px" border="1px solid white" rounded="xl" hidden={md}>
                                    <Image
                                        src={day_winners[selectedRank].prompt}
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
                                                        src={day_winners[selectedRank].twitter.profile_image_url}
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
                                                        {day_winners[selectedRank].twitter.name}
                                                    </Text>
                                                    <Text m={0}>@{day_winners[selectedRank].twitter.username}</Text>
                                                </VStack>
                                            </HStack>
                                            <HStack gap={3} mt={-2}>
                                                <HStack gap={1}>
                                                    <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                                        Votes:
                                                    </Text>
                                                    <Text m={0} fontSize="lg" fontWeight={600} color="#FFD700">
                                                        {day_winners[selectedRank].score}
                                                    </Text>
                                                </HStack>

                                                <Divider orientation="vertical" h={6} />

                                                <Tooltip label="Retweet" hasArrow fontSize="large" offset={[0, 15]}>
                                                    <div>
                                                        <FaRetweet
                                                            size={sm ? 30 : 42}
                                                            color="rgba(0,0,0,0.45)"
                                                            onClick={() => shareEntry(entries[random_entry].key, today_date)}
                                                            style={{ marginTop: -2, cursor: "pointer" }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                            </HStack>
                                        </HStack>
                                        <Text m={0} fontSize="lg" fontWeight={600} color="white">
                                            {wrapLongWords(day_winners[selectedRank].entry)}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </HStack>
                        )}
                        <Divider />
                    </VStack>
                </VStack>
            </VStack>
        </>
    );
}

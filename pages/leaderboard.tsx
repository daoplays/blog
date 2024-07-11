import { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Text,
    TableContainer,
    HStack,
    Input,
    Button,
    useDisclosure,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    VStack,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Link,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";

import { UserData } from "../components/state/state";
import useAppRoot from "../components/context/useAppRoot";
import Head from "next/head";
import useResponsive from "../hooks/useResponsive";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import styles from "../styles/Launch.module.css";
import { MdEdit } from "react-icons/md";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import UseWalletConnection from "../components/blog/apps/commonHooks/useWallet";
import Layout from "./layout";
import { trimAddress } from "../components/state/utils";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM, firebaseConfig } from "../components/state/constants";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, Database } from "firebase/database";
import { DayRow } from "../components/state/interfaces";
import DialectCTA from "../components/blinkbash/dialect";
import { useGetDayEntries } from "../hooks/useGetDayEntries";
interface Header {
    text: string;
    field: string | null;
}

const LeaderboardPage = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { twitterList, userList, currentUserData, entryList, leaderboardList } = useAppRoot();
    const { md, sm, lg, xl } = useResponsive();
    const [selected, setSelected] = useState("Today");
    const [database, setDatabase] = useState<Database | null>(null);
    const [date, setDate] = useState<number>(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)));
    const [day_rows, setDayRows] = useState<DayRow[]>([]);
    const [sortedField, setSortedField] = useState<string | null>("votes");
    const [reverseSort, setReverseSort] = useState<boolean>(true);
    const getDaysEntries = useGetDayEntries();

    useEffect(() => {
        if (database !== null) {
            return;
        }

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Initialize Realtime Database and get a reference to the service
        const db = getDatabase(app);
        setDatabase(db);
    }, [database]);

    let userVec: UserData[] = [];
    if (userList !== null && twitterList !== null) {
        userList.forEach((user) => {
            let twitter = twitterList.get(user.user_key.toString());
            if (twitter === undefined) {
                return;
            }
            userVec.push(user);
        });
    }

    const tableHeaders: Header[] =
        selected === "Global"
            ? [
                  { text: "RANK", field: "rank" },
                  { text: "USER", field: "user" },
                  { text: "ADDRESS", field: "address" },
                  { text: "WINS", field: "wins" },
                  { text: "VOTES", field: "votes" },
                  { text: "VOTED", field: "voted" },
              ]
            : [
                  { text: "RANK", field: "rank" },
                  { text: "USER", field: "user" },
                  { text: "ADDRESS", field: "address" },
                  { text: "SCORE", field: "score" },
                  { text: "VIEW", field: "view" },
              ];
    const handleHeaderClick = (field: string | null) => {
        console.log("field", field);
        if (field === sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(field);
            setReverseSort(false);
        }
    };

    const sortedUsers = userVec.sort((a, b) => {
        if (sortedField === "user") {
            let a_name = twitterList.get(a.user_key.toString());
            let b_name = twitterList.get(b.user_key.toString());

            return reverseSort ? b_name.username.localeCompare(a_name.username) : a_name.username.localeCompare(b_name.username);
        } else if (sortedField === "votes") {
            let a_score = a.total_positive_votes - a.total_negative_votes;
            let b_score = b.total_positive_votes - b.total_negative_votes;
            return reverseSort ? b_score - a_score : a_score - b_score;
        } else if (sortedField === "voted") {
            let a_score = a.total_positive_voted + a.total_negative_voted;
            let b_score = b.total_positive_voted + b.total_negative_voted;
            return reverseSort ? b_score - a_score : a_score - b_score;
        } else if (sortedField === "wins") {
            return reverseSort ? b.total_wins - a.total_wins : a.total_wins - b.total_wins;
        }

        return 0;
    });

    const DayRowCard = ({ row, index }: { row: DayRow; index: number }) => {
        const isUser = currentUserData === null ? false : row.key === currentUserData.user_key.toString();
        const rank = index + 1;
        let address = trimAddress(row.key);
        console.log("day row ", row.twitter.username, row.score);
        let colour = isUser ? "yellow" : "white";
        let link = "https://dial.to/?action=solana-action:" + encodeURIComponent(row.link);
        return (
            <Tr>
                <Td color={colour} py={4}>
                    {rank}
                </Td>
                <Td color={colour}>{row.twitter.username}</Td>
                <Td color={colour}>{address}</Td>
                <Td color={colour}>{row.score}</Td>
                <Td color={colour}>
                    {
                        <Link href={link} isExternal>
                            <FaExternalLinkAlt />
                        </Link>
                    }
                </Td>
            </Tr>
        );
    };

    const UserCard = ({ user, index }: { user: UserData; index: number }) => {
        if (twitterList === null) return <></>;

        const isUser = currentUserData === null ? false : user.user_key.equals(currentUserData.user_key);
        let twitter_id = twitterList.get(user.user_key.toString());
        if (twitter_id === undefined) {
            return <></>;
        }
        const rank = index + 1;
        let wins = user.total_wins;
        let votes = user.total_positive_votes - user.total_negative_votes;
        let voted = user.total_positive_voted + user.total_negative_voted;
        let address = trimAddress(user.user_key.toString());

        let colour = isUser ? "yellow" : "white";

        return (
            <Tr>
                <Td color={isUser ? "yellow" : "white"} py={4}>
                    {rank}
                </Td>
                <Td color={colour}>{twitter_id.username}</Td>
                <Td color={colour}>{address}</Td>
                <Td color={colour}>{wins.toString()}</Td>
                <Td color={colour}>{votes.toString()}</Td>
                <Td color={colour}>{voted.toString()}</Td>
            </Tr>
        );
    };

    useEffect(() => {
        getDaysEntries(date, setDayRows);
    }, [date, getDaysEntries]);

    return (
        <Layout>
            <HStack w={sm ? "100%" : "700px"} bg="#0ab7f2" spacing={8} mx={5} rounded="xl">
                <VStack w={sm ? "100%" : "700px"} border="1px solid white" p={4} rounded="xl" shadow="xl">
                    <HStack justifyContent="space-between" w="full">
                        {["Today", "Global"].map((name, i) => {
                            const isActive = selected === name;

                            const baseStyle = {
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            };

                            const activeStyle = {
                                color: isActive ? "#FFDD56" : "white",
                                borderBottom: isActive ? "2px solid #FFDD56" : "",
                                opacity: isActive ? 1 : 0.5,
                            };

                            return (
                                <HStack
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        ...activeStyle,
                                    }}
                                    onClick={() => {
                                        setSelected(name);
                                    }}
                                    px={4}
                                    py={2}
                                    mt={-2}
                                    w={"fit-content"}
                                    justify="center"
                                >
                                    <Text m={"0 auto"} fontSize="lg" fontWeight="bold">
                                        {name}
                                    </Text>
                                </HStack>
                            );
                        })}
                    </HStack>
                    <TableContainer w="full" maxH={500} mt={3} overflowY="auto">
                        <Table size="sm" colorScheme="teal" style={{ color: "white", fontWeight: 600 }}>
                            <Thead>
                                <Tr>
                                    {tableHeaders.map((i) => (
                                        <Th
                                            key={i.text}
                                            style={{ cursor: i.text === "RANK" || i.text === "LINK" ? "" : "pointer" }}
                                            onClick={() => handleHeaderClick(i.field)}
                                        >
                                            <HStack gap={sm ? 1 : 2}>
                                                <Text m={0}>{i.text}</Text>
                                                {i.text === "RANK" || i.text === "LINK" ? <></> : <FaSort />}
                                            </HStack>
                                        </Th>
                                    ))}
                                </Tr>
                            </Thead>

                            {selected === "Today" ? (
                                <Tbody>
                                    {day_rows.map((row, i) => {
                                        return <DayRowCard key={row.key} row={row} index={i} />;
                                    })}
                                </Tbody>
                            ) : (
                                <Tbody>
                                    {sortedUsers.map((user, i) => {
                                        return <UserCard key={user.user_key.toString()} user={user} index={i} />;
                                    })}
                                </Tbody>
                            )}
                        </Table>
                    </TableContainer>
                </VStack>
            </HStack>
            <Image
                src="/images/leaderboard-man.png"
                alt="Leaderboard Man Character"
                width={300}
                height={300}
                style={{ position: "absolute", bottom: -20, left: 50, zIndex: -50 }}
                hidden={xl}
            />

            <DialectCTA />
        </Layout>
    );
};

export default LeaderboardPage;

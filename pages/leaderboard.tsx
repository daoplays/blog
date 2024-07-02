import { useState } from "react";
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
} from "@chakra-ui/react";
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

interface Header {
    text: string;
    field: string | null;
}

const LeaderboardPage = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { twitterList, userList, currentUserData } = useAppRoot();
    const { xs, sm, lg } = useResponsive();

    let userVec: UserData[] = [];
    if (userList !== null) {
        userList.forEach((user) => {
            let twitter = twitterList.get(user.user_key.toString());
            if (twitter === undefined) {
                return;
            }
            userVec.push(user);
        });
    }

    const LeaderboardTable = () => {
        const { sm } = useResponsive();

        const [sortedField, setSortedField] = useState<string | null>("votes");
        const [reverseSort, setReverseSort] = useState<boolean>(true);

        const tableHeaders: Header[] = [
            { text: "RANK", field: "rank" },
            { text: "USER", field: "user" },
            { text: "WINS", field: "wins" },
            { text: "VOTES", field: "votes" },
            { text: "VOTED", field: "voted" },
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

        console.log("user vec", userVec);

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


        return (
            <>
                <TableContainer>
                    <table
                        width="100%"
                        className="custom-centered-table font-face-rk"
                        style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
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
                                    <th key={i.text} style={{ minWidth: sm ? "90px" : "120px" }}>
                                        <HStack
                                            gap={sm ? 1 : 2}
                                            justify="center"
                                            style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                                            onClick={() => handleHeaderClick(i.field)}
                                        >
                                            <Text fontSize={sm ? "medium" : "large"} m={0}>
                                                {i.text}
                                            </Text>
                                            {i.text === "RANK" ? <></> : <FaSort />}
                                        </HStack>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {sortedUsers.map((user, i) => {
                                return <UserCard key={user.user_key.toString()} user={user} index={i} />;
                            })}
                        </tbody>
                    </table>
                </TableContainer>
            </>
        );
    };

    const UserCard = ({ user, index }: { user: UserData; index: number }) => {
        const { twitterList } = useAppRoot();

        if (twitterList === null) return <></>;
        const isUser = user.user_key.equals(currentUserData?.user_key);
        let twitter_id = twitterList.get(user.user_key.toString());
        if (twitter_id === undefined) {
            return <></>;
        }
        const rank = index + 1;
        let wins = user.total_wins;
        let votes = user.total_positive_votes - user.total_negative_votes;
        let voted = user.total_positive_voted + user.total_negative_voted;

        return (
            <tr style={{ background: index % 2 == 0 ? "" : "rgba(255, 255, 255, 0.1)" }}>
                <td>
                    <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                        {rank}
                    </Text>
                </td>
                <td>
                    <Text fontSize={"large"} my={6} color={isUser ? "yellow" : "white"}>
                        {twitter_id.username}
                    </Text>
                </td>

                <td style={{ minWidth: "160px" }}>
                    <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                        {wins.toString()}
                    </Text>
                </td>
                <td style={{ minWidth: "160px" }}>
                    <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                        {votes.toString()}
                    </Text>
                </td>
                <td style={{ minWidth: "160px" }}>
                    <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                        {voted.toString()}
                    </Text>
                </td>
            </tr>
        );
    };

    if (!wallet.connected) {
        return (
            <HStack w="100%" align="center" justify="center" mt={25}>
                <Text
                    fontSize={lg ? "large" : "x-large"}
                    m={0}
                    color={"white"}
                    onClick={() => handleConnectWallet()}
                    style={{ cursor: "pointer" }}
                >
                    Sign in to view Leaderboard
                </Text>
            </HStack>
        );
    }

    return (
        <>
            <Head>
                <title>Leaderboard</title>
            </Head>
            <main>
                <Flex
                    px={4}
                    py={wallet.connected ? 18 : sm ? 22 : 37}
                    gap={2}
                    alignItems="center"
                    justifyContent="end"
                    style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                >
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        Leaderboard
                    </Text>
                </Flex>

                <LeaderboardTable />
            </main>
        </>
    );
};

export default LeaderboardPage;

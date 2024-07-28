import Image from "next/image";
import { useEffect, useState } from "react";
import { Text, TableContainer, HStack, VStack, Table, Thead, Tr, Th, Tbody, Td, Link } from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { FaSort } from "react-icons/fa";
import { UserData } from "../components/state/state";
import useResponsive from "../hooks/useResponsive";
import useAppRoot from "../components/context/useAppRoot";
import { trimAddress } from "../components/state/utils";
import useDayEntriesStore from "../stores/dayEntries";
interface Header {
    text: string;
    field: string | null;
}

const LeaderboardPage = () => {
    const { xl, sm } = useResponsive();

    const [selected, setSelected] = useState("Today");
    const [date, setDate] = useState<number>(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)));
    const [sortedField, setSortedField] = useState<string | null>("votes");
    const [reverseSort, setReverseSort] = useState<boolean>(true);

    const { dayEntries, getDayEntries } = useDayEntriesStore();

    let today_date = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));

    const { twitterList, userList, currentUserData, database, entryList } = useAppRoot();

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

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                getDayEntries(database, entryList, twitterList, today_date);
            } catch (error) {
                console.error("Error fetching day entries:", error);
            }
        };
        fetchEntries();
    }, [database, entryList, twitterList, getDayEntries, today_date]);

    useEffect(() => {
        console.log("Leaderboard: ", dayEntries);
    }, [dayEntries]);

    return (
        <VStack
            position="relative"
            justify="center"
            overflowY="auto"
            minHeight="100vh"
            background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)"
        >
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
                                    {dayEntries.map((row, i) => {
                                        const isUser = currentUserData === null ? false : row.key === currentUserData.user_key.toString();
                                        const rank = i + 1;
                                        let address = trimAddress(row.key);
                                        // console.log("day row ", row.twitter.username, row.score);
                                        let colour = isUser ? "yellow" : "white";
                                        let link = "https://dial.to/?action=solana-action:" + encodeURIComponent(row.link);

                                        return (
                                            <Tr key={i}>
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
                                    })}
                                </Tbody>
                            ) : (
                                <Tbody>
                                    {sortedUsers.map((user, i) => {
                                        if (twitterList === null) return <></>;

                                        const isUser = currentUserData === null ? false : user.user_key.equals(currentUserData.user_key);
                                        let twitter_id = twitterList.get(user.user_key.toString());
                                        if (twitter_id === undefined) {
                                            return <></>;
                                        }
                                        const rank = i + 1;
                                        let wins = user.total_wins;
                                        let votes = user.total_positive_votes - user.total_negative_votes;
                                        let voted = user.total_positive_voted + user.total_negative_voted;
                                        let address = trimAddress(user.user_key.toString());

                                        let colour = isUser ? "yellow" : "white";

                                        return (
                                            <Tr key={i}>
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
                style={{ position: "absolute", bottom: -20, left: 50 }}
                hidden={xl}
            />
        </VStack>
    );
};

export default LeaderboardPage;

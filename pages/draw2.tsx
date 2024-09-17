import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Input,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    useColorModeValue,
    SimpleGrid,
    Tooltip,
} from "@chakra-ui/react";
import Image from "next/image";
import DrawingCanvas from './draw'; // Adjust the import path as necessary
import { useWallet } from "@solana/wallet-adapter-react";
import TwitterIntegration from "../components/common/LinkTwitterAccount";
import useAppRoot from "../components/context/useAppRoot";
import useEntry from "../hooks/useEnter";
import { getDatabase, ref, get } from "firebase/database";
import { FaRetweet } from "react-icons/fa6";
import { TbReload } from "react-icons/tb";
import useVote from "../hooks/useVote";
import { PublicKey } from "@solana/web3.js";
import { wrapLongWords } from "../components/state/utils";
import Navigation from "../components/blinkbash/Navigation";

export default function ImageResponseGame() {
    const [textPrompt, setTextPrompt] = useState<string>("");
    const [imageResponse, setImageResponse] = useState<string>("");
    const [drawingFile, setDrawingFile] = useState<File | null>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [randomEntry, setRandomEntry] = useState<number>(0);

    const wallet = useWallet();
    const { twitter, database } = useAppRoot();
    const { handleEntry } = useEntry();
    const { Vote } = useVote();

    const isConnected = wallet.publicKey !== null;
    const today_date = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.300', 'gray.600');
    const frameColor = useColorModeValue('gray.200', 'gray.700');

    const getTextPrompt = useCallback(async () => {
        if (database === null) {
            return;
        }
        const prompt_db = await get(ref(database, "BlinkBash/textPrompts/0/" + today_date));
        let prompt_val = prompt_db.val();
        if (prompt_val === null) {
            setTextPrompt("No prompt available for today");
            return;
        }
        setTextPrompt(prompt_val.toString());
    }, [database, today_date]);

    useEffect(() => {
        getTextPrompt();
        // Add function to fetch entries here
        // fetchEntries(today_date, setEntries);
    }, [getTextPrompt]);

    const handleImageSubmit = () => {
        if (drawingFile) {
            // Handle submission of drawn image
           // handleEntry(wallet.publicKey, 1, textPrompt, drawingFile);
        } else if (imageResponse) {
            // Handle submission of image link
            //handleEntry(wallet.publicKey, 1, textPrompt, imageResponse);
        }
    };

    const handleDrawingSave = (file: File) => {
        setDrawingFile(file);
        setImageResponse(''); // Clear image link when a drawing is saved
    };

    const handleRandomiseEntry = () => {
        if (entries.length <= 1) return;
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * entries.length);
        } while (newIndex === randomEntry);
        setRandomEntry(newIndex);
    };

    return (
        <VStack spacing={4} align="center" width="100%" maxWidth="1200px" mx="auto" p={6}
              background="linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)">
            <Navigation />
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} width="full">
                <VStack spacing={4} align="stretch">
                    <Text fontSize="2xl" fontWeight="bold" color="white">Daily Text Prompt</Text>
                    <Box p={4} bg="#0ab7f2" border="1px solid white" rounded="xl" shadow="xl">
                        <Text fontSize="xl" color="white">{textPrompt}</Text>
                    </Box>
                    
                    <Tabs isFitted variant="enclosed">
                        <TabList mb="1em">
                            <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Link an Image</Tab>
                            <Tab color="white" _selected={{ color: "blue.500", bg: "white" }}>Draw an Image</Tab>
                        </TabList>
                        <TabPanels>
                            <TabPanel>
                                <Input 
                                    placeholder="Enter image URL"
                                    value={imageResponse}
                                    onChange={(e) => {
                                        setImageResponse(e.target.value);
                                        setDrawingFile(null); // Clear drawing when a link is entered
                                    }}
                                    bg="white"
                                />
                            </TabPanel>
                            <TabPanel>
                                <DrawingCanvas 
                                    width={400} 
                                    height={300} 
                                   // onSave={handleDrawingSave}
                                />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    {twitter && isConnected ? (
                        <Button
                            shadow="md"
                            _active={{ bg: "#FFE376" }}
                            _hover={{ opacity: "90%" }}
                            bg="#FFE376"
                            color="#BA6502"
                            rounded="lg"
                            w="full"
                            onClick={handleImageSubmit}
                        >
                            Submit Image Response
                        </Button>
                    ) : (
                        <TwitterIntegration />
                    )}
                </VStack>

                <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                        <Text fontSize="2xl" fontWeight="bold" color="white">Submitted Entries</Text>
                        <Tooltip label="Randomise" hasArrow>
                            <Button onClick={handleRandomiseEntry} leftIcon={<TbReload />}>
                                Randomise
                            </Button>
                        </Tooltip>
                    </HStack>
                    
                    {entries.length > 0 ? (
                        <Box bg="#0ab7f2" border="1px solid white" p={6} rounded="xl" shadow="xl">
                            <HStack justifyContent="space-between" mb={4}>
                                <HStack>
                                    <Image
                                        src={entries[randomEntry].twitter.profile_image_url}
                                        alt="Profile"
                                        width={60}
                                        height={60}
                                        style={{ borderRadius: '50%' }}
                                    />
                                    <VStack align="start" spacing={0}>
                                        <Text color="white" fontWeight="bold">{entries[randomEntry].twitter.name}</Text>
                                        <Text color="white">@{entries[randomEntry].twitter.username}</Text>
                                    </VStack>
                                </HStack>
                                <HStack>
                                    <Tooltip label="Share" hasArrow>
                                        <Button size="sm" leftIcon={<FaRetweet />}>Share</Button>
                                    </Tooltip>
                                    <Tooltip label="Upvote" hasArrow>
                                        <Button size="sm" onClick={() => Vote(new PublicKey(entries[randomEntry].key), 1, 1)}>👍</Button>
                                    </Tooltip>
                                    <Tooltip label="Downvote" hasArrow>
                                        <Button size="sm" onClick={() => Vote(new PublicKey(entries[randomEntry].key), 1, 2)}>👎</Button>
                                    </Tooltip>
                                </HStack>
                            </HStack>
                            <Image
                                src={entries[randomEntry].entry}
                                alt="Submitted Image"
                                width={400}
                                height={300}
                                style={{ objectFit: 'contain' }}
                            />
                        </Box>
                    ) : (
                        <Text color="white" fontSize="lg">No entries yet.</Text>
                    )}
                </VStack>
            </SimpleGrid>
        </VStack>
    );
}
import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Textarea,
    useDisclosure,
    Text,
    VStack,
} from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";

interface TweetEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendTweet: (tweetText: string) => void;
    initialText: string;
}

const TweetEditModal = ({ isOpen, onClose, onSendTweet, initialText }: TweetEditModalProps) => {
    const [tweetText, setTweetText] = useState<string>(initialText);

    useEffect(() => {
        setTweetText(initialText);
    }, [initialText]);

    const handleSendTweet = () => {
        onSendTweet(tweetText);
        onClose();
    };

    const { sm } = useResponsive();

    return (
        <Modal isCentered isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent maxWidth="650px" bg="#0ab7f2" p={6} rounded="xl" shadow="xl">
                <VStack spacing={4}>
                    <Text alignSelf="start" mb={0} color="white" fontSize={sm ? "xl" : "3xl"} className="font-face-wc">
                        Retweet Post
                    </Text>

                    <Textarea
                        m={0}
                        fontSize={"xl"}
                        fontWeight={600}
                        size="lg"
                        color="white"
                        maxLength={350}
                        rows={5}
                        _placeholder={{ color: "gray.300" }}
                        _active={{ border: "1px solid white" }}
                        _focus={{ border: "1px solid white" }}
                        value={tweetText}
                        onChange={(e) => setTweetText(e.target.value)}
                        resize="vertical"
                    />

                    <Button alignSelf="end" w="fit-content" bg="#FFE376" color="#BA6502" onClick={handleSendTweet}>
                        Send Tweet
                    </Button>
                </VStack>
            </ModalContent>
        </Modal>
    );
};

export default TweetEditModal;

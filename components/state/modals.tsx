import React, { useEffect, useState } from 'react';
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
  useDisclosure
} from '@chakra-ui/react';

interface TweetEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendTweet: (tweetText: string) => void;
    initialText: string;
  }

const TweetEditModal = ({ isOpen, onClose, onSendTweet, initialText } : TweetEditModalProps) => {
  const [tweetText, setTweetText] = useState<string>(initialText);

  useEffect(() => {
    setTweetText(initialText);
  }, [initialText]);
  
  console.log("dfault", initialText)
  const handleSendTweet = () => {
    onSendTweet(tweetText);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent 
      maxWidth="800px"
        bg="#0076CC" 
        _active={{ border: "1px solid white" }}
        _focus={{ border: "1px solid white" }}
        >
        <ModalHeader
        className="font-face-wc"
        color={"white"}
        m={0}  fontSize="4xl" 
        >Retweet Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Textarea
          m={0} fontSize={"xl"} fontWeight={600}
          size="lg"
          height="200px"
          color={"white"}
            value={tweetText}
            onChange={(e) => setTweetText(e.target.value)}
            resize="vertical"
          />
        </ModalBody>

        <ModalFooter>
          <Button bg="#FFE376" color="#BA6502" mr={3} onClick={handleSendTweet}>
            Send Tweet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TweetEditModal;
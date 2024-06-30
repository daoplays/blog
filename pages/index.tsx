import React, { useState } from "react";
import TwitterIntegration from "../components/common/LinkTwitterAccount";
import {
  AspectRatio,
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
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaSignOutAlt } from "react-icons/fa";
import UseWalletConnection from "../components/blog/apps/commonHooks/useWallet";
import trimAddress from "../components/blog/apps/utils/trimAddress";
import Image from "next/image";
require("@solana/wallet-adapter-react-ui/styles.css");
import { Montserrat } from "next/font/google";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BiSolidLeftArrow } from "react-icons/bi";
import useResponsive from "../components/blog/apps/commonHooks/useResponsive";
import { Tooltip } from "@chakra-ui/react";

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
  const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();
  const isConnected = wallet.publicKey !== null;

  const [startDate, setStartDate] = useState<Date>(new Date());

  const {
    isOpen: isStartOpen,
    onToggle: onToggleStart,
    onClose: onCloseStart,
  } = useDisclosure();

  return (
    <VStack
      className={montserrat.className}
      position="relative"
      justify="center"
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)",
      }}
    >
      <HStack
        h={20}
        px={5}
        position="fixed"
        top={0}
        w="full"
        alignItems="center"
        justify="space-between"
      >
        <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
          Blink<span style={{ color: "#FFDD56" }}>Bash!</span>
        </Text>

        <HStack
          gap={6}
          alignItems="center"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            width: "fit-content",
          }}
        >
          <Tooltip label="Coming Soon" hasArrow>
            <Text
              cursor="not-allowed"
              m={0}
              color="white"
              fontSize="2xl"
              className="font-face-wc"
              opacity="50%"
            >
              Shop
            </Text>
          </Tooltip>
          <Tooltip label="Coming Soon" hasArrow>
            <Text
              cursor="not-allowed"
              m={0}
              color="white"
              fontSize="2xl"
              className="font-face-wc"
              opacity="50%"
            >
              Leaderboard
            </Text>
          </Tooltip>
        </HStack>

        <Button
          shadow="md"
          colorScheme="yellow"
          color="#877714"
          rounded="lg"
          onClick={isConnected ? handleDisconnectWallet : handleConnectWallet}
        >
          {isConnected ? (
            <HStack align="center" spacing={2}>
              <FaSignOutAlt size={18} />
              <Text m={0}>{trimAddress(wallet.publicKey.toString())}</Text>
            </HStack>
          ) : (
            "Connect Wallet"
          )}
        </Button>
      </HStack>

      <HStack spacing={8} mx={5}>
        <VStack w="600px" justify="center" p={6}>
          <Text fontSize="2xl" fontWeight={600} color="white">
            1. Post your caption to the Daily Prompt as a Solana Blink on X
            (Twitter) and earn $BASH. <br />
            <br /> 2. Vote on others’ Blinks to earn $BASH. <br />
            <br />
            3. Spend $BASH on rewards sponsored by your favorite Solana
            projects!
          </Text>
        </VStack>

        <VStack
          w="500px"
          border="1px solid white"
          p={6}
          rounded="xl"
          shadow="xl"
        >
          <Text m={0} color="white" fontSize="5xl" className="font-face-wc">
            Daily Prompt
          </Text>

          <HStack spacing={4}>
            <Text m="0" color="white" className="font-face-kg">
              {startDate.toLocaleDateString()}
            </Text>
            <Popover
              isOpen={isStartOpen}
              onClose={onCloseStart}
              placement="bottom"
              closeOnBlur={false}
            >
              <PopoverTrigger>
                <IconButton
                  onClick={onToggleStart}
                  aria-label="FaCalendarAlt"
                  icon={<FaCalendarAlt size={24} />}
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
            <BiSolidLeftArrow
              size={28}
              color="white"
              style={{ cursor: "pointer" }}
            />
                     
               <Box
              position="relative"
              h="250px"
              w="250px"
              mt={2}
              border="1px dashed white"
              rounded="xl"
            >
              <Image
                  src="/images/prompt.png"
                  width={250}
                  height={250}
                  alt="Image Frame"
                  style={{ backgroundSize: "cover", borderRadius: 12 }}
              />  
              <HStack
                bg="white"
                rounded="lg"
                p={1}
                px={2}
                gap={1}
                position="absolute"
                bottom={2}
                right={2}
              >
                <Text m={0} fontSize="sm" fontWeight={500}>
                  Sponsored By:
                </Text>
                <Image
                  src="/images/logo.png"
                  alt="BlinkBlash Logo"
                  width={20}
                  height={20}
                />
              </HStack>
            </Box>
            <BiSolidLeftArrow
              size={28}
              color="white"
              style={{ rotate: "180deg", cursor: "pointer" }}
            />
          </HStack>

          <Textarea
            mt={3}
            placeholder="Enter your Caption Here"
            color="white"
            _placeholder={{ color: "gray.300" }}
            _active={{ border: "1px solid white" }}
          />

          <TwitterIntegration />
        </VStack>
      </HStack>

      <Image
        src="/images/builder.png"
        alt="Builder Character"
        width={xl ? 250 : 350}
        height={xl ? 250 : 350}
        style={{ position: "absolute", bottom: 0, left: 0 }}
      />
    </VStack>
  );
}

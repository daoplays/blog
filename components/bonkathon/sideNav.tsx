import { VStack, HStack, Text, Link, Spacer } from "@chakra-ui/react";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { FaBook, FaCalendarDays, FaChartLine, FaCircleQuestion, FaClipboardList, FaQuestion } from "react-icons/fa6";
import { GiCook, GiToken } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { BsPersonSquare } from "react-icons/bs";
import { RiGalleryFill, RiGalleryLine } from "react-icons/ri";
import Image from "next/image";
import { FaHome } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import { TbLayoutSidebarLeftExpandFilled, TbLayoutSidebarRightExpandFilled } from "react-icons/tb";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../blog/apps/commonHooks/useWallet";

const tabs = {
    create: [
        {
            icon: (size: number) => <GiToken size={size} />,
            tab: "New AMM",
            url: "/launch",
        },
    ],

    trade: [
        {
            icon: (size: number) => <FaChartLine size={size} />,
            tab: "Tokens",
            url: "/trade",
        },
    ],

    profile: [
        {
            icon: (size: number) => <GiCook size={size} />,
            tab: "Creator Dashboard",
            url: "/dashboard",
        },
        {
            icon: (size: number) => <MdLeaderboard size={size} />,
            tab: "Leaderboard",
            url: "/leaderboard",
        },
    ],

    info: [
        {
            icon: (size: number) => <FaClipboardList size={size} />,
            tab: "Terms",
            url: "/terms",
        },
        {
            icon: (size: number) => <FaCircleQuestion size={size} />,
            tab: "FAQs",
            url: "/faq",
        },
    ],
};

export interface TabProps {
    icon?: ReactNode;
    tab: string;
    url: string;
    sidePanelCollapsed: boolean;
}

const SideNav = ({
    sidePanelCollapsed,
    setSidePanelCollapsed,
}: {
    sidePanelCollapsed: boolean;
    setSidePanelCollapsed: Dispatch<SetStateAction<boolean>>;
}) => {
    const { sm } = useResponsive();
    console.log("collapsed", sidePanelCollapsed);

    return (
        <VStack
            bg="url(/images/rough-white.png)"
            backgroundSize="cover"
            width={sidePanelCollapsed ? "260px" : "fit-content"}
            h="calc(100%)"
            position="sticky"
            top="0px"
            bottom="0px"
            pt={50}
            overflowY="auto"
            hidden={sm}
        >
            <VStack h="100%" w="100%" px={sm ? 0 : "sm"}>
                <VStack align={!sidePanelCollapsed ? "center" : "start"} h="100%" w="100%" p={4}>
                    <div style={{ cursor: "pointer" }} onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)} hidden={sm}>
                        {sidePanelCollapsed ? (
                            <TbLayoutSidebarRightExpandFilled size={35} color="#683309" />
                        ) : (
                            <TbLayoutSidebarLeftExpandFilled size={35} color="#683309" />
                        )}
                    </div>
                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Create
                    </Text>
                    {tabs.create.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} url={url} sidePanelCollapsed={sidePanelCollapsed} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Trade
                    </Text>
                    {tabs.trade.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} url={url} sidePanelCollapsed={sidePanelCollapsed} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Profile
                    </Text>
                    {tabs.profile.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} url={url} sidePanelCollapsed={sidePanelCollapsed} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Info
                    </Text>
                    {tabs.info.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} url={url} sidePanelCollapsed={sidePanelCollapsed} />
                    ))}
                </VStack>
            </VStack>
        </VStack>
    );
};

const Tab = ({ icon, tab, url, sidePanelCollapsed }: TabProps) => {
    const wallet = useWallet();
    const router = useRouter();
    const { handleConnectWallet } = UseWalletConnection();
    return (
        <HStack
            justify={!sidePanelCollapsed ? "start" : "center"}
            w="100%"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.15)inset"
            bg={"transparent"}
            color={"#683309"}
            cursor={"pointer"}
            borderRadius={8}
            spacing={4}
            py={sidePanelCollapsed ? 2 : 2.5}
            px={sidePanelCollapsed ? 4 : 2}
            onClick={() => {
                if (
                    (tab === "New Token" ||
                        tab === "New Hybrid" ||
                        tab === "Creator Dashboard" ||
                        tab === "My Bags" ||
                        tab === "Leaderboard") &&
                    !wallet.connected
                ) {
                    handleConnectWallet();
                } else {
                    if (tab === "Documentation") {
                        window.open("https://docs.letscook.wtf/", "_blank");
                    } else {
                        router.push(url);
                    }
                }
            }}
        >
            {icon}
            {sidePanelCollapsed && (
                <Text m={0} fontFamily="ReemKufiRegular" fontWeight="regular" fontSize={"large"} align="center">
                    {tab}
                </Text>
            )}
        </HStack>
    );
};

export default SideNav;

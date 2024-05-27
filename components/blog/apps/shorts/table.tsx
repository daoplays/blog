import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../commonHooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { MintData, bignum_to_num } from "../common";
import { AMMData, AMMLaunch, Screen } from "./state";
import { useWallet } from "@solana/wallet-adapter-react";
import { TfiReload } from "react-icons/tfi";
import { Mint } from "@solana/spl-token";
import ShowExtensions from "../utils/extensions";
interface Header {
    text: string;
    field: string | null;
}





const AMMTable = ({ ammList, setCurrentLaunch, setScreen }: { ammList: Map<String, AMMLaunch>, setCurrentLaunch : Dispatch<SetStateAction<AMMLaunch>>, setScreen  : Dispatch<SetStateAction<Screen>> }) => {
    const { sm } = useResponsive();

    
    let amm_array = ammList ? Array.from(ammList, ([name, value]) => ({ name, value })) : [];

    console.log("in table", amm_array)
    const [sortedField, setSortedField] = useState<string>("end_date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

   
    const handleHeaderClick = (e) => {
        if (e == sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(e);
            setReverseSort(false);
        }
    };

    const tableHeaders: Header[] = [
        { text: "BASE", field: null },
        { text: "QUOTE", field: null },
        { text: "PRICE", field: null },
        { text: "FDMC", field: "fdmc" },
        { text: "EXTENSIONS", field: null },
    ];

    return (
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
                                <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {/* {i.text === "LOGO" || i.text === "END" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {amm_array.map((launch, i) => (
                        <LaunchCard key={i} amm_launch={launch.value} setCurrentLaunch={setCurrentLaunch} setScreen={setScreen} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ amm_launch, setCurrentLaunch, setScreen }: { amm_launch: AMMLaunch; setCurrentLaunch : Dispatch<SetStateAction<AMMLaunch>>; setScreen  : Dispatch<SetStateAction<Screen>>  }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();

    let last_price = Buffer.from(amm_launch.amm_data.last_price).readFloatLE(0);
    let total_supply = Number(amm_launch.base.mint.supply) / Math.pow(10, amm_launch.base.mint.decimals)
     
    let market_cap = total_supply * last_price;

    return (
        <tr
            style={{
                cursor: "pointer",
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            onClick={() => {setCurrentLaunch(amm_launch); setScreen(Screen.trade)}}
        >
            <td style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={amm_launch.base.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {amm_launch.base.symbol}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={amm_launch.quote.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {amm_launch.quote.symbol}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {last_price < 1e-3 ? last_price.toExponential(3) : last_price.toFixed(Math.min(amm_launch.base.mint.decimals, 3))}
                    </Text>
                    <Image src={amm_launch.quote.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {market_cap.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                    <Image src={amm_launch.quote.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "140px" }}>
                <ShowExtensions extension_flag={amm_launch.base.extensions} />
            </td>
            
        </tr>
    );
};

export default AMMTable;

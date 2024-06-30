import React, { useCallback, useState } from "react";
import { Box, HStack, Stack } from "@chakra-ui/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { CategoryScale, LinearScale, BarElement, Chart as ChartJS } from "chart.js";

import { Bar } from "react-chartjs-2";
import BN from "bn.js";
import { struct, u64, u8 } from "@project-serum/borsh";
import { randomBytes } from "crypto";

ChartJS.register(CategoryScale, LinearScale, BarElement);

const genprogramId = new PublicKey("Dj75yJnPpACJdVLi5hgoEVXmQvteohEPPs4ezSkmjekc");
const creator = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");

const data_seed = "rng_v1.0";

const RNGArgs = struct([u8("instruction"), u64("initial_seed"), u8("method")]);

const RNGMethod = {
    xorshift: 0,
    hash: 1,
    fasthash: 2,
    none: 3,
};

const RNGInstruction = {
    generate: 0,
};

export function GenRandoms() {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [myArray, setMyArray] = useState<number[]>([]);
    const [radio, setRadio] = useState<String>("Xorshift");

    function createHistogram(data: number[]) {
        var bins: number[] = [];
        var bin_values: string[] = [];
        var interval = 0.05;
        var numOfBuckets = 20;

        // Init Bins
        for (var i = 0; i < numOfBuckets; i += 1) {
            bins.push(0);
            bin_values.push((interval * i).toFixed(2));
        }

        //Loop through data and add to bin's count
        for (var i = 0; i < data.length; i++) {
            var item = data[i];

            var bin: number = Math.floor(item / interval);
            bins[bin] += 1;
        }

        return { bins: bins, bin_values: bin_values };
    }

    const greet = useCallback(async () => {
        const rng_pubkey = await PublicKey.createWithSeed(creator, data_seed, genprogramId);

        //console.log("have pub key ", rng_pubkey.toString());

        var rng_account = await connection.getAccountInfo(rng_pubkey);
        if (rng_account === null) {
            console.log("data account is null");
        }

        const value2 = randomBytes(8);
        const bn = new BN(value2.toString("hex"), 16);
        const data = Buffer.alloc(RNGArgs.span);
        let method = RNGMethod.xorshift;
        if (radio === "Sha2Hash") {
            method = RNGMethod.hash;
        }
        if (radio === "MurmurHash") {
            method = RNGMethod.fasthash;
        }
        if (radio === "None") {
            method = RNGMethod.none;
        }
        //console.log("using", radio, method, bn.toString());

        RNGArgs.encode(
            {
                instruction: RNGInstruction.generate,
                initial_seed: bn,
                method: method,
            },
            data,
        );

        const rng_instruction = new TransactionInstruction({
            keys: [{ pubkey: rng_pubkey, isSigner: false, isWritable: true }],
            programId: genprogramId,
            data: data,
        });

        let myspan = document.getElementById("myspan");
        if (myspan === null) return;

        var response = null;
        var signature: string | null = null;
        myspan.style.fontSize = "medium";
        try {
            var text = '<p style="text-align:left">Sending Transaction... ';
            myspan.innerHTML = text + "<br /><br /><br /><br /><br /></p>";
            signature = await wallet.sendTransaction(new Transaction().add(rng_instruction), connection);
            text += "transaction sent<br>";
            text += "confirming execution.. ";

            myspan.innerHTML = text + "<br /><br /><br /><br /></p>";

            await connection.confirmTransaction(signature, "processed");
            console.log("signature: ", signature);
            text += "execution confirmed<br>";
            text += "getting logs:<br>";
            myspan.innerHTML = text + "<br /><br /><br /></p>";
        } catch (error) {
            console.log(error);
            return;
        }

        while (response == null) {
            response = await connection.getTransaction(signature);
        }

        if (
            response["meta"] === undefined ||
            response["meta"] === null ||
            response["meta"]["logMessages"] === undefined ||
            response["meta"]["logMessages"] === null
        )
            return;

        //console.log("result: ", response["meta"]["logMessages"].length);
        const logs = response["meta"]["logMessages"];
        text += logs[1] + "<br>";
        text += logs[2] + "<br>";
        myspan.innerHTML = text + "</p>";

        // get the data
        rng_account = await connection.getAccountInfo(rng_pubkey);

        if (rng_account === null) return;

        let num2 = new Float64Array(rng_account.data.buffer);
        //console.log(num2);
        let n_generated = 256;
        if (radio === "Sha2Hash") {
            n_generated = 60;
        }
        if (radio === "None") {
            n_generated = 0;
        }
        for (let i = 0; i < n_generated; i++) {
            setMyArray((arr) => [...arr, num2[i]]);
        }
    }, [radio, connection, wallet]);

    function DrawChart() {
        if (myArray.length == 0) return <></>;

        var hist_data = createHistogram(myArray);
        var data2 = {
            labels: hist_data["bin_values"],
            datasets: [
                {
                    label: "# of Votes",
                    data: hist_data["bins"],
                    borderWidth: 1,
                },
            ],
        };

        var options = {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5,
                        beginAtZero: true,
                    },
                },
            },
        };
        return <Bar redraw data={data2} options={options} />;
    }

    return (
        <Box mt="1rem" textAlign="center" fontSize="l" width="full" borderRadius={10} borderWidth={2} p={10}>
            <HStack marginBottom="10px" alignItems={"center"}>
                <Box as="button" onClick={greet} borderWidth={"1px"} borderColor={"black"}>
                    Generate Randoms
                </Box>
                <Box>
                    <Stack direction="row">
                        <Box
                            as="button"
                            onClick={() => setRadio("Xorshift")}
                            borderWidth="1px"
                            borderColor={radio === "Xorshift" ? "black" : "white"}
                        >
                            Xorshift
                        </Box>
                        <Box
                            as="button"
                            onClick={() => setRadio("MurmurHash")}
                            borderWidth="1px"
                            borderColor={radio === "MurmurHash" ? "black" : "white"}
                        >
                            Murmur
                        </Box>
                        <Box
                            as="button"
                            onClick={() => setRadio("Sha2Hash")}
                            borderWidth="1px"
                            borderColor={radio === "Sha2Hash" ? "black" : "white"}
                        >
                            SHA2
                        </Box>
                        <Box
                            as="button"
                            onClick={() => setRadio("None")}
                            borderWidth="1px"
                            borderColor={radio === "None" ? "black" : "white"}
                        >
                            None
                        </Box>
                    </Stack>
                </Box>
            </HStack>
            <HStack>
                <Box>
                    <span id="myspan">
                        {" "}
                        Waiting To Generate Random Numbers with {radio} <br />
                        <br />
                        <br />
                        <br />
                        <br />
                    </span>
                </Box>
            </HStack>

            <DrawChart />
        </Box>
    );
}

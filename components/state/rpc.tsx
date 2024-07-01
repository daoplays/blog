import { PublicKey } from "@solana/web3.js";
import { Config, PROGRAM } from "./constants";

// Example POST method implementation:
export async function postData(url = "", bearer = "", data = {}) {
    //console.log("in post data", data)
    // Default options are marked with *
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export interface GPAccount {
    pubkey: PublicKey;
    data: Buffer;
}

export async function RunGPA(): Promise<GPAccount[]> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [PROGRAM.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(Config.RPC_NODE, "", body);
    } catch (error) {
        console.log(error);
        return [];
    }

    //console.log(program_accounts_result["result"]);

    let result = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        //console.log(i, program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");

        // we dont want the program account
        if (decoded_data[0] === 0) continue;

        result.push({ pubkey: new PublicKey(program_accounts_result["result"][i]["pubkey"]), data: decoded_data });
    }

    return result;
}

export async function getRecentPrioritizationFees(PROD: boolean): Promise<number> {
    let feeMicroLamports = 100000;
    if (PROD) {
        try {
            const response = await fetch(Config.RPC_NODE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getPriorityFeeEstimate",
                    params: [
                        {
                            accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
                            options: {
                                //"recommended": true,
                                includeAllPriorityFeeLevels: true,
                            },
                        },
                    ],
                }),
            });
            const data = await response.json();
            console.log("Fee: ", data);
        } catch (error) {
            console.log("Error: ", error);
        }
    }

    return feeMicroLamports;
}

interface BlockHash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export async function get_current_blockhash(bearer: string): Promise<BlockHash> {
    var body = { id: 1, jsonrpc: "2.0", method: "getLatestBlockhash" };
    const blockhash_data_result = await postData(Config.RPC_NODE, bearer, body);

    console.log(Config.RPC_NODE);
    let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
    let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];

    let hash_data: BlockHash = { blockhash: blockhash, lastValidBlockHeight: last_valid };

    return hash_data;
}

interface BasicReply {
    id: number;
    jsonrpc: string;
    result: string;
    error: string;
}

export function check_json(json_response: BasicReply): boolean {
    if (json_response.result === undefined) {
        if (json_response.error !== undefined) {
            console.log(json_response.error);
        }
        return false;
    }

    if (json_response.result === null) return false;

    return true;
}

interface TransactionResponseData {
    id: number;
    jsonrpc: string;
    result: string;
}

export async function send_transaction(bearer: string, encoded_transaction: string): Promise<TransactionResponseData> {
    var body = { id: 1, jsonrpc: "2.0", method: "sendTransaction", params: [encoded_transaction, { skipPreflight: true }] };

    var response_json = await postData(Config.RPC_NODE, bearer, body);
    let transaction_response: TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    transaction_response.result = "INVALID";
    return transaction_response;
}

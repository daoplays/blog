import { PublicKey} from "@solana/web3.js";
import {  Config, PROGRAM } from "./constants";



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
        if (decoded_data[0] === 1) continue;

        result.push({ pubkey: new PublicKey(program_accounts_result["result"][i]["pubkey"]), data: decoded_data });
    }

    return result;
}
import { Connection, PublicKey } from "@solana/web3.js";
import { Config, METAPLEX_META, PROGRAM } from "./constants";
import { MintData } from "./interfaces";
import { ExtensionType, Mint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getExtensionData, getMetadataPointerState, getPermanentDelegate, getTransferFeeConfig, getTransferHook, unpackMint } from "@solana/spl-token";
import { Extensions } from "./state";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { unpack, TokenMetadata } from "@solana/spl-token-metadata";


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

export async function fetchWithTimeout(resource, timeout: number) {
    const options = { timeout: timeout };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);

    return response;
}



export async function getMintData(connection: Connection, mint: Mint, token_program: PublicKey): Promise<MintData | null> {
    let uri: string | null = null;
    let metadata_pointer = null;
    let name: string;
    let symbol: string;
    if (token_program.equals(TOKEN_2022_PROGRAM_ID)) {
        // first look for t22 metadata
        metadata_pointer = getMetadataPointerState(mint);
    }

    //console.log("get mint data", mint.address.toString());
    if (metadata_pointer !== null) {
        //console.log("havemetadata pointer ",mint.address.toString(),  metadata_pointer.metadataAddress.toString());
        const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData);
        let metadata: TokenMetadata = unpack(data);
        //console.log(metadata)
        uri = metadata.uri;
        name = metadata.name;
        symbol = metadata.symbol;
    } else {
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), mint.address.toBuffer()],
            METAPLEX_META,
        )[0];
        let raw_meta_data = await connection.getAccountInfo(token_meta_key);

        if (raw_meta_data === null) {
            return null;
        }

        let meta_data = Metadata.deserialize(raw_meta_data.data);
        //console.log(meta_data);
        //console.log(meta_data[0].data.symbol, meta_data[0].data.name);
        uri = meta_data[0].data.uri;
        name = meta_data[0].data.name;
        symbol = meta_data[0].data.symbol;
    }

    // check the extensions we care about
    let transfer_hook = getTransferHook(mint);
    let transfer_fee_config = getTransferFeeConfig(mint);
    let permanent_delegate = getPermanentDelegate(mint);

    let extensions =
        (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
        (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(transfer_hook !== null));

    //console.log(name, uri);
    let icon: string;
    uri = uri.replace("https://cf-ipfs.com/", "https://gateway.moralisipfs.com/");
    try {
        let uri_json = await fetchWithTimeout(uri, 3000).then((res) => res.json());
        //console.log(uri_json)
        icon = uri_json["image"];
    } catch (error) {
        console.log("error getting uri, using SOL icon");
        console.log(error);
        icon = "/images/sol.png";
    }
    let mint_data: MintData = {
        mint: mint,
        uri: uri,
        name: name,
        symbol: symbol,
        icon: icon,
        extensions: extensions,
        token_program: token_program,
    };

    //console.log("have mint data", mint_data);
    return mint_data;
}

export async function setMintData(token_mint: string): Promise<MintData | null> {
    if (token_mint === "" || !token_mint) {
        return null;
    }

    let token_key;

    try {
        // Attempt to create a PublicKey instance
        token_key = new PublicKey(token_mint);
        // If no error is thrown, input is a valid public key
    } catch (error) {
        return null;
    }

    const connection = new Connection(Config.RPC_NODE, {
        wsEndpoint: Config.WSS_NODE,
    });
    let result = await connection.getAccountInfo(token_key, "confirmed");
    //console.log(result)
    let mint: Mint;
    let token_program: PublicKey;
    if (result.owner.equals(TOKEN_PROGRAM_ID)) {
        try {
            mint = unpackMint(token_key, result, TOKEN_PROGRAM_ID);
            token_program = TOKEN_PROGRAM_ID;
            // console.log(mint);
        } catch (error) {
            console.log(error);
            return null;
        }
    } else {
        try {
            mint = unpackMint(token_key, result, TOKEN_2022_PROGRAM_ID);
            token_program = TOKEN_2022_PROGRAM_ID;
            // console.log(mint);
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    let mint_data = await getMintData(connection, mint, token_program);

    return mint_data;
}

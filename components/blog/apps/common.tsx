import { BeetStruct, COption, FixableBeetStruct, bignum, coption, u64, u8 } from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import {
    Mint,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getMetadataPointerState,
    getPermanentDelegate,
    getTokenMetadata,
    getTransferFeeConfig,
    getTransferHook,
    unpackMint,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Extensions } from "./utils/extensions";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const DEV_RPC_NODE = "https://nickie-qn2k6r-fast-devnet.helius-rpc.com";
export const DEV_WSS_NODE = "wss://devnet.helius-rpc.com/?api-key=8c0a541e-cdf4-4c1e-8bf9-de66a1962d6f";

class Basic_Instruction {
    constructor(readonly instruction: number) {}

    static readonly struct = new BeetStruct<Basic_Instruction>(
        [["instruction", u8]],
        (args) => new Basic_Instruction(args.instruction!),
        "Basic_Instruction",
    );
}

export function serialise_basic_instruction(instruction: number): Buffer {
    const data = new Basic_Instruction(instruction);
    const [buf] = Basic_Instruction.struct.serialize(data);

    return buf;
}

export function uInt8ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(1);
    bytes.writeUInt8(num);

    return bytes;
}

export function uInt16ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(2);
    bytes.writeUInt16LE(num);

    return bytes;
}

export function uInt32ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(num);

    return bytes;
}

export function bignum_to_num(bn: bignum): number {
    let value = new BN(bn).toNumber();

    return value;
}

export class TokenAccount {
    constructor(
        readonly mint: PublicKey,
        readonly owner: PublicKey,
        readonly amount: bignum,
        readonly delegate: COption<PublicKey>,
        readonly state: number,
        readonly is_native: COption<bignum>,
        readonly delegated_amount: bignum,
        readonly close_authority: COption<PublicKey>,
    ) {}

    static readonly struct = new FixableBeetStruct<TokenAccount>(
        [
            ["mint", publicKey],
            ["owner", publicKey],
            ["amount", u64],
            ["delegate", coption(publicKey)],
            ["state", u8],
            ["is_native", coption(u64)],
            ["delegated_amount", u64],
            ["close_authority", coption(publicKey)],
        ],
        (args) =>
            new TokenAccount(
                args.mint!,
                args.owner!,
                args.amount!,
                args.delegate!,
                args.state!,
                args.is_native!,
                args.delegated_amount!,
                args.close_authority!,
            ),
        "TokenAccount",
    );
}

interface TokenBalanceData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
        };
    };
    error: string;
}

interface AccountData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            data: [string, string];
            executable: boolean;
            lamports: number;
            owner: string;
        };
    };
    error: string;
}

export interface MintInfo {
    mint: Mint;
    program: PublicKey;
}

interface BasicReply {
    id: number;
    jsonrpc: string;
    result: string;
    error: string;
}

// Example POST method implementation:
export async function postData(url = "", data = {}) {
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

export async function request_token_supply(mint: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getTokenSupply",
        params: [mint.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(DEV_RPC_NODE, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return 0;
    }

    let token_amount;
    try {
        let parsed_response: TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    } catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}

export async function request_token_amount(pubkey: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getTokenAccountBalance",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(DEV_RPC_NODE, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return 0;
    }

    let token_amount;
    try {
        let parsed_response: TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    } catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}

export async function request_raw_account_data(pubkey: PublicKey): Promise<Buffer | null> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(DEV_RPC_NODE, body);
    } catch (error) {
        console.log(error);
        return null;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return null;
    }

    let account_data;
    try {
        let parsed_account_data: AccountData = response;

        if (parsed_account_data.result.value === null) {
            return null;
        }

        let account_encoded_data = parsed_account_data.result.value.data;
        account_data = Buffer.from(account_encoded_data[0], "base64");
    } catch (error) {
        console.log(error);
        return null;
    }

    return account_data;
}

export async function RunCollectionDAS(collection: PublicKey): Promise<void> {
    const response = await fetch(DEV_RPC_NODE, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByGroup",
            params: {
                groupKey: "collection",
                groupValue: collection.toString(),
                page: 1, // Starts at 1
                limit: 1000,
                options: {
                    showZeroBalance: false,
                },
            },
        }),
    });
    const { result } = await response.json();
    console.log("Assets by Group: ", result.items);
    console.log(result.items[0]["burnt"]);
    const filtered = result.items.filter((asset) => asset.burnt === false);
    console.log("filtered:", filtered);
}

export interface GPAccount {
    pubkey: PublicKey;
    data: Buffer;
}

export async function RunGPA(program: PublicKey): Promise<GPAccount[]> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [program.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(DEV_RPC_NODE, body);
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

        result.push({
            pubkey: new PublicKey(program_accounts_result["result"][i]["pubkey"]),
            data: decoded_data,
        });
    }

    return result;
}

export interface MintData {
    mint: Mint;
    uri: string;
    name: string;
    symbol: string;
    icon: string;
    extensions: number;
    token_program: PublicKey;
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

    const connection = new Connection(DEV_RPC_NODE, {
        wsEndpoint: DEV_WSS_NODE,
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

    let uri = null;
    let metadata_pointer = null;
    let name: string;
    let symbol: string;
    if (result.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        // first look for t22 metadata
        metadata_pointer = getMetadataPointerState(mint);
        //console.log("metadata pinter:", metadata_pointer);
    }

    if (metadata_pointer !== null) {
        let metadata = await getTokenMetadata(connection, token_key, "confirmed", TOKEN_2022_PROGRAM_ID);
        //console.log(metadata);
        uri = metadata.uri;

        name = metadata.name;
        symbol = metadata.symbol;
    } else {
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_key.toBuffer()],
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
    // console.log("extensions", extensions);

    //console.log("deserialize meta data");

    //console.log("uri: ", uri)
    let icon: string;
    try {
        let uri_json = await fetch(uri).then((res) => res.json());
        icon = uri_json["image"];
    } catch (error) {
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

    return mint_data;
}

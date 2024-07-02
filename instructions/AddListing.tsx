import { useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BASH, CORE, Config, DATA_ACCOUNT_SEED, PDA_ACCOUNT_SEED, PROGRAM, SYSTEM_KEY, WHITELIST } from "../components/state/constants";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { FixableBeetStruct, bignum, u32, u64, u8 } from "@metaplex-foundation/beet";
import { BashInstruction } from "../components/state/state";
import { getRecentPrioritizationFees, setMintData } from "../components/state/rpc";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { fetchAssetV1, collectionAddress } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

class AddListing_Instruction {
    constructor(
        readonly instruction: number,
        readonly item_type: number,
        readonly quantity: bignum,
        readonly price: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<AddListing_Instruction>(
        [
            ["instruction", u8],
            ["item_type", u8],
            ["quantity", u64],
            ["price", u64],
        ],
        (args) => new AddListing_Instruction(args.instruction!, args.item_type!, args.quantity!, args.price!),
        "AddListing_Instruction",
    );
}

function serialise_AddListing_instruction(item_type: number, quantity: number, price: number): Buffer {
    const data = new AddListing_Instruction(BashInstruction.AddListing, item_type, quantity, price);
    const [buf] = AddListing_Instruction.struct.serialize(data);

    return buf;
}

export const GetAddListingInstruction = async (user: PublicKey, item: PublicKey, item_type: number, quantity: number, price: number) => {
    let listing = PublicKey.findProgramAddressSync([item.toBytes(), Buffer.from("Listing")], PROGRAM)[0];

    let pda = PublicKey.findProgramAddressSync([uInt32ToLEBytes(PDA_ACCOUNT_SEED)], PROGRAM)[0];

    let user_item = SYSTEM_KEY;
    let pda_item = SYSTEM_KEY;

    let item_decimals = 1;
    if (item_type === 1) {
        let mint = await setMintData(item.toString());
        item_decimals = Math.pow(10, mint.mint.decimals);
        user_item = getAssociatedTokenAddressSync(item, user, false, TOKEN_2022_PROGRAM_ID);
        pda_item = getAssociatedTokenAddressSync(item, pda, true, TOKEN_2022_PROGRAM_ID);
    }

    let collection = SYSTEM_KEY;
    if (item_type === 2) {
        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let umiKey = publicKey(item.toString());

        const asset = await fetchAssetV1(umi, umiKey);
        let try_collection = collectionAddress(asset);
        if (try_collection !== undefined) collection = new PublicKey(try_collection.toString());
    }

    let user_token = getAssociatedTokenAddressSync(WHITELIST, user, true, TOKEN_2022_PROGRAM_ID);
    const instruction_data = serialise_AddListing_instruction(item_type, quantity * item_decimals, price * 10);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },

        { pubkey: pda, isSigner: false, isWritable: true },

        { pubkey: WHITELIST, isSigner: false, isWritable: true },
        { pubkey: user_token, isSigner: false, isWritable: true },

        { pubkey: item, isSigner: false, isWritable: true },
        { pubkey: listing, isSigner: false, isWritable: true },

        { pubkey: pda_item, isSigner: false, isWritable: true },
        { pubkey: user_item, isSigner: false, isWritable: true },
        { pubkey: collection, isSigner: false, isWritable: true },

        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        { pubkey: CORE, isSigner: false, isWritable: true },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
    ];

    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    let instructions: TransactionInstruction[] = [];

    let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));
    instructions.push(list_instruction);

    return instructions;
};

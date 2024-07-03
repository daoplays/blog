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
import { toast } from "react-toastify";

class BuyItem_Instruction {
    constructor(
        readonly instruction: number,
        readonly quantity: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<BuyItem_Instruction>(
        [
            ["instruction", u8],
            ["quantity", u64],
        ],
        (args) => new BuyItem_Instruction(args.instruction!, args.quantity!),
        "BuyItem_Instruction",
    );
}

function serialise_BuyItem_instruction(quantity: number): Buffer {
    const data = new BuyItem_Instruction(BashInstruction.BuyListing, quantity);
    const [buf] = BuyItem_Instruction.struct.serialize(data);

    return buf;
}

export const GetBuyItemInstruction = async (user: PublicKey, item: PublicKey, item_type: number, quantity: number) => {
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
        if (try_collection === undefined) {
            toast.error("Collection not found");
            return;
        }
        collection = new PublicKey(try_collection.toString());
    }

    let user_token = getAssociatedTokenAddressSync(BASH, user, true, TOKEN_2022_PROGRAM_ID);
    const instruction_data = serialise_BuyItem_instruction(quantity * item_decimals);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: pda, isSigner: false, isWritable: true },

        { pubkey: item, isSigner: false, isWritable: true },
        { pubkey: listing, isSigner: false, isWritable: true },

        { pubkey: pda_item, isSigner: false, isWritable: true },
        { pubkey: user_item, isSigner: false, isWritable: true },
        { pubkey: collection, isSigner: false, isWritable: true },

        { pubkey: BASH, isSigner: false, isWritable: true },
        { pubkey: user_token, isSigner: false, isWritable: true },

        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        { pubkey: CORE, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
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

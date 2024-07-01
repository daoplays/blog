import { useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BASH, Config, DATA_ACCOUNT_SEED, PDA_ACCOUNT_SEED, PROGRAM, SYSTEM_KEY } from "../components/state/constants";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { FixableBeetStruct, u32, u8 } from "@metaplex-foundation/beet";
import { BashInstruction } from "../components/state/state";
import { getRecentPrioritizationFees } from "../components/state/rpc";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

class ClaimPrize_Instruction {
    constructor(
        readonly instruction: number,
        readonly game: number,
        readonly date: number,
    ) {}

    static readonly struct = new FixableBeetStruct<ClaimPrize_Instruction>(
        [
            ["instruction", u8],
            ["game", u8],
            ["date", u32],
        ],
        (args) => new ClaimPrize_Instruction(args.instruction!, args.game!, args.date!),
        "ClaimPrize_Instruction",
    );
}

function serialise_ClaimPrize_instruction(game: number, date: number): Buffer {
    const data = new ClaimPrize_Instruction(BashInstruction.Vote, game, date);
    const [buf] = ClaimPrize_Instruction.struct.serialize(data);

    return buf;
}

export const GetClaimPrizeInstruction = async (user: PublicKey, game: number, date: number) => {
    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];
    let leaderboard = PublicKey.findProgramAddressSync(
        [uInt8ToLEBytes(game), uInt32ToLEBytes(date), Buffer.from("Leaderboard")],
        PROGRAM,
    )[0];
    let entry = PublicKey.findProgramAddressSync([user.toBytes(), uInt8ToLEBytes(game), uInt32ToLEBytes(date)], PROGRAM)[0];

    let pda = PublicKey.findProgramAddressSync([uInt32ToLEBytes(PDA_ACCOUNT_SEED)], PROGRAM)[0];
    let user_token = getAssociatedTokenAddressSync(BASH, user, true, TOKEN_2022_PROGRAM_ID);
    const instruction_data = serialise_ClaimPrize_instruction(game, date);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },

        { pubkey: pda, isSigner: false, isWritable: true },

        { pubkey: entry, isSigner: false, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },
        { pubkey: leaderboard, isSigner: false, isWritable: true },
        { pubkey: BASH, isSigner: false, isWritable: true },
        { pubkey: user_token, isSigner: false, isWritable: true },

        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
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
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(list_instruction);

    return instructions;
};

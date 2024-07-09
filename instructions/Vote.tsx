import { useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { BASH, Config, DATA_ACCOUNT_SEED, PDA_ACCOUNT_SEED, PROGRAM, SYSTEM_KEY } from "../components/state/constants";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { FixableBeetStruct, u8 } from "@metaplex-foundation/beet";
import { BashInstruction } from "../components/state/state";
import { getRecentPrioritizationFees } from "../components/state/rpc";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

class Vote_Instruction {
    constructor(
        readonly instruction: number,
        readonly game: number,
        readonly vote: number,
    ) {}

    static readonly struct = new FixableBeetStruct<Vote_Instruction>(
        [
            ["instruction", u8],
            ["game", u8],
            ["vote", u8],
        ],
        (args) => new Vote_Instruction(args.instruction!, args.game!, args.vote!),
        "Vote_Instruction",
    );
}

function serialise_Vote_instruction(game: number, vote: number): Buffer {
    const data = new Vote_Instruction(BashInstruction.Vote, game, vote);
    const [buf] = Vote_Instruction.struct.serialize(data);

    return buf;
}

export const GetVoteInstruction = async (user: PublicKey, creator: PublicKey, game: number, vote: number, ref: PublicKey) => {
    let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];
    let creator_data_account = PublicKey.findProgramAddressSync([creator.toBytes(), Buffer.from("User")], PROGRAM)[0];
    let leaderboard = PublicKey.findProgramAddressSync(
        [uInt8ToLEBytes(game), uInt32ToLEBytes(current_date), Buffer.from("Leaderboard")],
        PROGRAM,
    )[0];
    let entry = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(game), uInt32ToLEBytes(current_date)], PROGRAM)[0];

    let pda = PublicKey.findProgramAddressSync([uInt32ToLEBytes(PDA_ACCOUNT_SEED)], PROGRAM)[0];
    let stats = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
    let user_token = getAssociatedTokenAddressSync(BASH, user, true, TOKEN_2022_PROGRAM_ID);

    let ref_bash : PublicKey = PROGRAM;
    if (!ref.equals(PROGRAM)) {
        ref_bash =  getAssociatedTokenAddressSync(BASH, ref, true, TOKEN_2022_PROGRAM_ID);

    }

    const instruction_data = serialise_Vote_instruction(game, vote);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },

        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: stats, isSigner: false, isWritable: true },

        { pubkey: entry, isSigner: false, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },
        { pubkey: creator, isSigner: false, isWritable: true },
        { pubkey: creator_data_account, isSigner: false, isWritable: true },
        { pubkey: leaderboard, isSigner: false, isWritable: true },
        { pubkey: BASH, isSigner: false, isWritable: true },
        { pubkey: user_token, isSigner: false, isWritable: true },

        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
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
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(list_instruction);

    return instructions;
};

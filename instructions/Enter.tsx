import { useConnection } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Config, DATA_ACCOUNT_SEED, PDA_ACCOUNT_SEED, PROGRAM, SYSTEM_KEY } from "../components/state/constants";
import { uInt32ToLEBytes, uInt8ToLEBytes } from "../components/blog/apps/common";
import { FixableBeetStruct, u8 } from "@metaplex-foundation/beet";
import { BashInstruction } from "../components/state/state";
import { getRecentPrioritizationFees } from "../components/state/rpc";

class Enter_Instruction {
    constructor(
        readonly instruction: number,
        readonly game: number,
    ) {}

    static readonly struct = new FixableBeetStruct<Enter_Instruction>(
        [
            ["instruction", u8],
            ["game", u8],
        ],
        (args) => new Enter_Instruction(args.instruction!, args.game!),
        "Enter_Instruction",
    );
}

function serialise_Enter_instruction(game: number): Buffer {
    const data = new Enter_Instruction(BashInstruction.Enter, game);
    const [buf] = Enter_Instruction.struct.serialize(data);

    return buf;
}


export const GetEnterInstruction = async (user: PublicKey, game : number) => {

    let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

    let pda = PublicKey.findProgramAddressSync([uInt32ToLEBytes(PDA_ACCOUNT_SEED)], PROGRAM)[0];
    let stats = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
    let entry = PublicKey.findProgramAddressSync([user.toBytes(), uInt8ToLEBytes(game), uInt32ToLEBytes(current_date)], PROGRAM)[0];

   

    const instruction_data = serialise_Enter_instruction(game);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },

        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: stats, isSigner: false, isWritable: true },

        { pubkey: entry, isSigner: false, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },

        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
    ];


    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    let instructions : TransactionInstruction[] = []

    let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
    
    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(list_instruction);

    return instructions
}
import {
  BeetStruct,
  u8,
  u16,
  u64,
  i16,
  bignum,
  utf8String,
  FixableBeetStruct,
} from "@metaplex-foundation/beet";
import {
  ComputeBudgetProgram,
  SYSVAR_RENT_PUBKEY,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
  Keypair,
  AccountMeta,
} from "@solana/web3.js";

export const PROGRAM = new PublicKey(
  "326p2wwfCBU36E52VShvsuh8WHkLenmbnEbxbKf3ja6z",
);
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);
export const DEV_RPC_NODE =
  "https://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95/";
export const DEV_WSS_NODE =
  "wss://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95/";

class Create_Asset_Instruction {
  constructor(
    readonly instruction: number,
    readonly name: string,
    readonly uri: string,
  ) {}

  static readonly struct = new FixableBeetStruct<Create_Asset_Instruction>(
    [
      ["instruction", u8],
      ["name", utf8String],
      ["uri", utf8String],
    ],
    (args) =>
      new Create_Asset_Instruction(args.instruction!, args.name!, args.uri!),
    "Create_Asset_Instruction",
  );
}

class Transfer_Instruction {
  constructor(readonly instruction: number) {}

  static readonly struct = new FixableBeetStruct<Transfer_Instruction>(
    [["instruction", u8]],
    (args) => new Transfer_Instruction(args.instruction!),
    "Transfer_Instruction",
  );
}

export function serialise_CreateAsset_instruction(
  instruction: number,
  name: string,
  uri: string,
): Buffer {
  const data = new Create_Asset_Instruction(instruction, name, uri);
  const [buf] = Create_Asset_Instruction.struct.serialize(data);

  return buf;
}

export function serialise_CreateTransfer_instruction(): Buffer {
  const data = new Transfer_Instruction(2);
  const [buf] = Transfer_Instruction.struct.serialize(data);

  return buf;
}

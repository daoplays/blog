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
import { AssetV1 } from "@metaplex-foundation/mpl-core";
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
  "42BuBercjs5puXz9evhkiYbxYoQtuuSo8zDXkWFRFM9a",
);
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);
export const METAPLEX_META = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export const DEV_RPC_NODE =
  "https://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95/";
export const DEV_WSS_NODE =
  "wss://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95/";

export const Extensions = {
  None: 0,
  TransferFee: 1,
  PermanentDelegate: 2,
  TransferHook: 4,
};

export const enum OptionsInstruction {
  init = 0,
  create_collection = 1,
  create_option = 2,
  transfer = 3,
  execute = 4,
  refund = 5,
  list = 6,
  purchase = 7,
}

export interface OptionData {
  token_name: string;
  token_image: string;
  token_uri: string;
  token_symbol: string;
  amount: number;
}

export interface Asset {
  address: PublicKey;
  asset: AssetV1;
}

export const default_option_data : OptionData = {
  token_name: "",
  token_image: "",
  token_uri: "",
  token_symbol: "",
  amount: 0

}

class Create_Collection_Instruction {
  constructor(
    readonly instruction: number,
    readonly name: string,
    readonly uri: string,
  ) {}

  static readonly struct = new FixableBeetStruct<Create_Collection_Instruction>(
    [
      ["instruction", u8],
      ["name", utf8String],
      ["uri", utf8String],
    ],
    (args) =>
      new Create_Collection_Instruction(
        args.instruction!,
        args.name!,
        args.uri!,
      ),
    "Create_Collection_Instruction",
  );
}

class Create_Option_Instruction {
  constructor(
    readonly instruction: number,
    readonly name: string,
    readonly uri: string,
    readonly token_amount: bignum,
    readonly side: number,
    readonly end_date: bignum,
    readonly strike: bignum,
    readonly price: bignum,
  ) {}

  static readonly struct = new FixableBeetStruct<Create_Option_Instruction>(
    [
      ["instruction", u8],
      ["name", utf8String],
      ["uri", utf8String],
      ["token_amount", u64],
      ["side", u8],
      ["end_date", u64],
      ["strike", u64],
      ["price", u64],
    ],
    (args) =>
      new Create_Option_Instruction(
        args.instruction!,
        args.name!,
        args.uri!,
        args.token_amount!,
        args.side!,
        args.end_date!,
        args.strike!,
        args.price!,
      ),
    "Create_Option_Instruction",
  );
}

class Basic_Instruction {
  constructor(readonly instruction: number) {}

  static readonly struct = new FixableBeetStruct<Basic_Instruction>(
    [["instruction", u8]],
    (args) => new Basic_Instruction(args.instruction!),
    "Transfer_Instruction",
  );
}

class List_Instruction {
  constructor(
    readonly instruction: number,
    readonly price: bignum,
  ) {}

  static readonly struct = new FixableBeetStruct<List_Instruction>(
    [
      ["instruction", u8],
      ["price", u64],
    ],
    (args) => new List_Instruction(args.instruction!, args.price!),
    "List_Instruction",
  );
}

export function serialise_CreateCollection_instruction(
  name: string,
  uri: string,
): Buffer {
  const data = new Create_Collection_Instruction(
    OptionsInstruction.create_collection,
    name,
    uri,
  );
  const [buf] = Create_Collection_Instruction.struct.serialize(data);

  return buf;
}

export function serialise_CreateOption_instruction(
  name: string,
  uri: string,
  token_amount: number,
  side: number,
  end_date: number,
  strike: number,
  price: number,
): Buffer {
  const data = new Create_Option_Instruction(
    OptionsInstruction.create_option,
    name,
    uri,
    token_amount,
    side,
    end_date,
    strike,
    price,
  );
  const [buf] = Create_Option_Instruction.struct.serialize(data);

  return buf;
}

export function serialise_List_instruction(
  price: number,
): Buffer {
  const data = new List_Instruction(OptionsInstruction.list, price);
  const [buf] = List_Instruction.struct.serialize(data);

  return buf;
}

export function serialise_basic_instruction(instruction: number): Buffer {
  const data = new Basic_Instruction(instruction);
  const [buf] = Basic_Instruction.struct.serialize(data);

  return buf;
}

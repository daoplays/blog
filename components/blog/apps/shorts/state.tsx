import { PublicKey } from "@solana/web3.js";

import {
  FixableBeetStruct,
  BeetStruct,
  uniformFixedSizeArray,
  u8,
  u16,
  u32,
  u64,
  i64,
  bignum,
  utf8String,
  array,
  fixedSizeArray,
  u128,
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { MintData } from "../common";

export const PROGRAM = new PublicKey(
  "twy8tiAMy9TVpVTdnSJF9X9cgAgmKthsrKtcRZnzU7y",
);

export const enum Screen {
  create = 0,
  trade = 1,
  table = 2,
}

export const enum AMMInstruction {
  init = 0,
  init_amm = 1,
  swap = 2,
  add_liquidity = 3,
  remove_liquidity = 4,
}

export interface AMMLaunch {
  amm_data: AMMData;
  base: MintData;
  quote: MintData;
}

export class AMMData {
  constructor(
    readonly account_type: number,
    readonly base_mint: PublicKey,
    readonly quote_mint: PublicKey,
    readonly lp_mint: PublicKey,
    readonly base_key: PublicKey,
    readonly quote_key: PublicKey,
    readonly short_key: PublicKey,
    readonly fee: number,
    readonly num_data_accounts: number,
    readonly last_price: number[],
    readonly lp_amount: bignum,
    readonly borrow_cost: number,
  ) {}

  static readonly struct = new FixableBeetStruct<AMMData>(
    [
      ["account_type", u8],
      ["base_mint", publicKey],
      ["quote_mint", publicKey],
      ["lp_mint", publicKey],
      ["base_key", publicKey],
      ["quote_key", publicKey],
      ["short_key", publicKey],
      ["fee", u16],
      ["num_data_accounts", u32],
      ["last_price", uniformFixedSizeArray(u8, 4)],
      ["lp_amount", u64],
      ["borrow_cost", u16],
    ],
    (args) =>
      new AMMData(
        args.account_type!,
        args.base_mint!,
        args.quote_mint!,
        args.lp_mint!,
        args.base_key!,
        args.quote_key!,
        args.short_key!,
        args.fee!,
        args.num_data_accounts!,
        args.last_price!,
        args.lp_amount!,
        args.borrow_cost!,
      ),
    "AMMData",
  );
}

export class OHLCV {
  constructor(
    readonly timestamp: number,
    readonly open: number[],
    readonly high: number[],
    readonly low: number[],
    readonly close: number[],
    readonly volume: number[],
  ) {}

  static readonly struct = new FixableBeetStruct<OHLCV>(
    [
      ["timestamp", i64],
      ["open", uniformFixedSizeArray(u8, 4)],
      ["high", uniformFixedSizeArray(u8, 4)],
      ["low", uniformFixedSizeArray(u8, 4)],
      ["close", uniformFixedSizeArray(u8, 4)],
      ["volume", uniformFixedSizeArray(u8, 4)],
    ],
    (args) =>
      new OHLCV(
        args.timestamp!,
        args.open!,
        args.high!,
        args.low!,
        args.close!,
        args.volume!,
      ),
    "OHLCV",
  );
}

export class TimeSeriesData {
  constructor(
    readonly account_type: number,
    readonly data: OHLCV[],
  ) {}

  static readonly struct = new FixableBeetStruct<TimeSeriesData>(
    [
      ["account_type", u8],
      ["data", array(OHLCV.struct)],
    ],
    (args) => new TimeSeriesData(args.account_type!, args.data!),
    "TimeSeriesData",
  );
}

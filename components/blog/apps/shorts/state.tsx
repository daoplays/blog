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
  "DQ8rUMXqfvD6HYVt15ci9xLETZZuz49z5Q1i8tXNWSdq",
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
  create_collection = 5,
  enter_short = 6,
  exit_short = 7,
  liquidate_short = 8,
  enter_long = 6,
  exit_long = 7,
  liquidate_long = 8,
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
    readonly fee: number,
    readonly num_data_accounts: number,
    readonly last_price: number[],
    readonly lp_amount: bignum,
    readonly borrow_cost: number,
    readonly leverage_fraction: number,
    readonly amm_base_amount: bignum,
    readonly amm_quote_amount: bignum,
    readonly short_base_amount: bignum,
    readonly long_quote_amount: bignum,
  ) {}

  static readonly struct = new FixableBeetStruct<AMMData>(
    [
      ["account_type", u8],
      ["base_mint", publicKey],
      ["quote_mint", publicKey],
      ["lp_mint", publicKey],
      ["base_key", publicKey],
      ["quote_key", publicKey],
      ["fee", u16],
      ["num_data_accounts", u32],
      ["last_price", uniformFixedSizeArray(u8, 4)],
      ["lp_amount", u64],
      ["borrow_cost", u16],
      ["leverage_fraction", u16],
      ["amm_base_amount", u64],
      ["amm_quote_amount", u64],
      ["short_base_amount", u64],
      ["long_quote_amount", u64],
    ],
    (args) =>
      new AMMData(
        args.account_type!,
        args.base_mint!,
        args.quote_mint!,
        args.lp_mint!,
        args.base_key!,
        args.quote_key!,
        args.fee!,
        args.num_data_accounts!,
        args.last_price!,
        args.lp_amount!,
        args.borrow_cost!,
        args.leverage_fraction!,
        args.amm_base_amount!,
        args.amm_quote_amount!,
        args.short_base_amount!,
        args.long_quote_amount!,
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

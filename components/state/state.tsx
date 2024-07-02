import { PublicKey, Keypair, LAMPORTS_PER_SOL, AccountInfo } from "@solana/web3.js";
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
    coption,
    COption,
    DataEnumKeyAsKind,
    dataEnum,
    FixableBeetArgsStruct,
    BeetArgsStruct,
    FixableBeet,
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";

export const Extensions = {
    None: 0,
    TransferFee: 1,
    PermanentDelegate: 2,
    TransferHook: 4,
};

export enum BashInstruction {
    Init = 0,
    Enter = 1,
    Vote = 2,
    ClaimPrize = 3,
    AddListing = 4,
    BuyListing = 5,
}

export enum AccountType {
    Program = 0,
    User = 1,
    Entry = 2,
    Leaderboard = 3,
    Listing = 4,
}

export class UserData {
    constructor(
        readonly account_type: number,
        readonly user_key: PublicKey,
        readonly user_id: number,
        readonly twitter: string,
        readonly total_wins: number,
        readonly total_positive_votes: number,
        readonly total_negative_votes: number,
        readonly total_positive_voted: number,
        readonly total_negative_voted: number,
    ) {}

    static readonly struct = new FixableBeetStruct<UserData>(
        [
            ["account_type", u8],
            ["user_key", publicKey],
            ["user_id", u32],
            ["twitter", utf8String],
            ["total_wins", u32],
            ["total_positive_votes", u32],
            ["total_negative_votes", u32],
            ["total_positive_voted", u32],
            ["total_negative_voted", u32],
        ],
        (args) =>
            new UserData(
                args.account_type!,
                args.user_key!,
                args.user_id!,
                args.twitter!,
                args.total_wins!,
                args.total_positive_votes!,
                args.total_negative_votes!,
                args.total_positive_voted!,
                args.total_negative_voted!,
            ),
        "UserData",
    );
}

export class ListingData {
    constructor(
        readonly account_type: number,
        readonly item_type: number,
        readonly item_address: PublicKey,
        readonly price: bignum,
        readonly quantity: bignum,
        readonly bundle_size: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<ListingData>(
        [
            ["account_type", u8],
            ["item_type", u8],
            ["item_address", publicKey],
            ["price", u64],
            ["quantity", u64],
            ["bundle_size", u64],
        ],
        (args) => new ListingData(args.account_type!, args.item_type!, args.item_address!, args.price!, args.quantity!, args.bundle_size!),
        "ListingData",
    );
}

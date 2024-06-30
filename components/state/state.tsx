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



export enum BashInstruction {
    Init = 0,
    Enter = 1,
    Vote = 2,
    ClaimPrize = 3,
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

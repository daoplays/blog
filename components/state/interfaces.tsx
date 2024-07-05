import { AssetV1 } from "@metaplex-foundation/mpl-core";
import { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export interface TwitterUser {
    name: string;
    username: string;
    profile_image_url: string;
}

export const default_twitter: TwitterUser = {
    name: "Anonymous",
    username: "anonymous",
    profile_image_url: "/images/anon_profile.png",
};


export interface MintData {
    mint: Mint;
    uri: string;
    name: string;
    symbol: string;
    icon: string;
    extensions: number;
    token_program: PublicKey;
}

export interface NFTData {
    mint: AssetV1;
    uri: string;
    icon: string;
}

export interface DayRow {
    key: string;
    twitter: TwitterUser;
    score: number;
    link: string;
    entry: string;
    prompt: string;
    claimed: boolean;
}

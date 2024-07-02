import { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export interface TwitterUser {
    name: string;
    username: string;
    profile_image_url: string;
}

export interface MintData {
    mint: Mint;
    uri: string;
    name: string;
    symbol: string;
    icon: string;
    extensions: number;
    token_program: PublicKey;
}

import { PublicKey } from "@solana/web3.js";

export interface NetworkConfig {
    PROD: boolean;
    NETWORK: string;
    RPC_NODE: string;
    WSS_NODE: string;
    IRYS_URL: string;
    IRYS_WALLET: string;
}

const MainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "mainnet",
    RPC_NODE: "https://kimmie-wuj3pm-fast-mainnet.helius-rpc.com",
    WSS_NODE: "wss://mainnet.helius-rpc.com/?api-key=8c0a541e-cdf4-4c1e-8bf9-de66a1962d6f",
    IRYS_URL: "https://node2.irys.xyz",
    IRYS_WALLET: "DHyDV2ZjN3rB6qNGXS48dP5onfbZd3fAEz6C5HJwSqRD",
};

export const BASH = new PublicKey("BASH6YCvhMeKGzTTmHquBCHeoyPJRDMYE7yQvYXerbcg");
export const WHITELIST = new PublicKey("BASHr9FsPoGq1LVWxSZLKHM6KMd7cjycjYH1eW25oC2K");
export const PROGRAM = new PublicKey("BASHv2NgqzdjKni4Rp7PxM2EzKZPSVGHCkC92ZfNZis3");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// account seeds
export const PDA_ACCOUNT_SEED = 6968193;
export const DATA_ACCOUNT_SEED = 10399637;

//timeout for transactions to be considered failed
export const TIMEOUT = 30000;

export let Config = MainNetConfig;

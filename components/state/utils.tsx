import { PublicKey } from "@solana/web3.js";
import { Config } from "./constants";

export const getSolscanLink = (key: PublicKey, type: string) => {
    let network =
        Config.NETWORK === "devnet"
            ? `?cluster=devnet`
            : Config.NETWORK === "eclipse"
              ? `?cluster=custom&customUrl=https://staging-rpc.dev2.eclipsenetwork.xyz`
              : "";

    if (type === "Token") {
        return `https://solscan.io/account/${key.toString()}${Config.PROD ? "" : network}`;
    }

    if (type === "Collection") {
        return `https://core.metaplex.com/explorer/collection/${key.toString()}${Config.PROD ? "" : `?env=devnet`}`;
    }
};

export const trimAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

export function wrapLongWords(text, maxCharsPerWord = 25) {
    return text.split(' ').map(word => {
      if (word.length <= maxCharsPerWord) {
        return word;
      }
      
      const chunks = [];
      for (let i = 0; i < word.length; i += maxCharsPerWord) {
        chunks.push(word.slice(i, i + maxCharsPerWord));
      }
      return chunks.join(' ');
    }).join(' ');
  }
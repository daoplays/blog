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
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useRef, useState, Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import {
  CORE,
  SYSTEM_KEY,
  DEV_RPC_NODE,
  DEV_WSS_NODE,
  serialise_basic_instruction
} from "../../common";
import { AMMData, AMMInstruction, PROGRAM } from "../state";
import { unpackMint } from "@solana/spl-token";

const useCreateCollection = () => {
  const wallet = useWallet();

  const GetCreateCollectionInstruction = async (base_mint_string: string,
    quote_mint_string: string) => {
    //console.log("in mint nft");

    
    let base_mint = new PublicKey(base_mint_string);
    let quote_mint = new PublicKey(quote_mint_string);


    let amm_seed_keys = [];
    if (base_mint.toString() < quote_mint.toString()) {
      amm_seed_keys.push(base_mint);
      amm_seed_keys.push(quote_mint);
    } else {
      amm_seed_keys.push(quote_mint);
      amm_seed_keys.push(base_mint);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
      [
        amm_seed_keys[0].toBytes(),
        amm_seed_keys[1].toBytes(),
        Buffer.from("AMM"),
      ],
      PROGRAM,
    )[0];


    //console.log("no lookup data found");
    let collection_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), Buffer.from("Collection")],
      PROGRAM,
    )[0];

    let program_pda = PublicKey.findProgramAddressSync(
      [Buffer.from("pda")],
      PROGRAM,
    )[0];

    const instruction_data = serialise_basic_instruction(
      AMMInstruction.create_collection,
    );

    var account_vector = [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: collection_account, isSigner: false, isWritable: true },
      { pubkey: amm_data_account, isSigner: false, isWritable: true },
      { pubkey: program_pda, isSigner: false, isWritable: true },
      { pubkey: CORE, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
    ];

    const list_instruction = new TransactionInstruction({
      keys: account_vector,
      programId: PROGRAM,
      data: instruction_data,
    });

    return list_instruction;
  };


  return { GetCreateCollectionInstruction };
};

export default useCreateCollection;

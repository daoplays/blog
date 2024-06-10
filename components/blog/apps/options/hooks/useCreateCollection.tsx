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
  PROGRAM,
  CORE,
  SYSTEM_KEY,
  serialise_CreateCollection_instruction,
} from "../state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../../common";

const useCreateCollection = (name: string, uri: string, token_mint: string) => {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState(false);

  const signature_ws_id = useRef<number | null>(null);

  const check_signature_update = useCallback(async (result: any) => {
    //console.log(result);
    // if we have a subscription field check against ws_id

    signature_ws_id.current = null;
    setIsLoading(false);

    if (result.err !== null) {
      toast.error("Transaction failed, please try again", {
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      return;
    }

    toast.success("Successfuly Created Collection!", {
      type: "success",
      isLoading: false,
      autoClose: 3000,
    });
  }, []);

  const transaction_failed = useCallback(async () => {
    if (signature_ws_id.current == null) return;

    signature_ws_id.current = null;
    setIsLoading(false);

    toast.error("Transaction not processed, please try again", {
      type: "error",
      isLoading: false,
      autoClose: 3000,
    });
  }, []);

  const GetCreateCollectionInstruction = async (base_mint_string : string, quote_mint_string : string) => {
    //console.log("in mint nft");

    console.log(name, uri);
    if (wallet.signTransaction === undefined) {
      //console.log(wallet, "invalid wallet");
      return;
    }

    if (signature_ws_id.current !== null) {
      //console.log("signature not null");
      alert("Transaction pending, please wait");
      return;
    }


    let base_mint = new PublicKey(base_mint_string);
    let quote_mint = new PublicKey(quote_mint_string);


    let seed_keys = [];
    if (base_mint_string < quote_mint_string) {
      seed_keys.push(base_mint);
      seed_keys.push(quote_mint);
    } else {
      seed_keys.push(quote_mint);
      seed_keys.push(base_mint);
    }

    let collection_account = PublicKey.findProgramAddressSync(
      [
        seed_keys[0].toBytes(),
        seed_keys[1].toBytes(),
        Buffer.from("Collection"),
      ],
      PROGRAM,
    )[0];

    let program_pda = PublicKey.findProgramAddressSync(
      [Buffer.from("pda")],
      PROGRAM,
    )[0];

    const instruction_data = serialise_CreateCollection_instruction(
      name + " Options",
      uri,
    );

    var account_vector = [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: collection_account, isSigner: false, isWritable: true },
      { pubkey: base_mint, isSigner: false, isWritable: true },
      { pubkey: quote_mint, isSigner: false, isWritable: true },
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

  const CreateCollection = async (base_mint_string : string, quote_mint_string : string) => {
    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });

    setIsLoading(true);

    let list_instruction = await GetCreateCollectionInstruction(base_mint_string, quote_mint_string);

    let blockhash_result = await connection.getLatestBlockhash();
    let txArgs = {
      blockhash: blockhash_result.blockhash,
      lastValidBlockHeight: blockhash_result.lastValidBlockHeight,
    };

    let transaction = new Transaction(txArgs);

    transaction.feePayer = wallet.publicKey;

    transaction.add(list_instruction);

    try {
      let signed_transaction = await wallet.signTransaction(transaction);

      var transaction_response = await connection.sendRawTransaction(
        signed_transaction.serialize(),
        { skipPreflight: true },
      );

      let signature = transaction_response;

      console.log("collection sig: ", signature);

      signature_ws_id.current = connection.onSignature(
        signature,
        check_signature_update,
        "confirmed",
      );
      setTimeout(transaction_failed, 20000);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      return;
    }
  };

  return { CreateCollection, GetCreateCollectionInstruction, isLoading };
};

export default useCreateCollection;

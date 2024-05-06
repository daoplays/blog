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
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  getTransferHook,
  resolveExtraAccountMeta,
  ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";

import {
  PROGRAM,
  CORE,
  SYSTEM_KEY,
  DEV_RPC_NODE,
  DEV_WSS_NODE,
  serialise_CreateCollection_instruction,
  serialise_basic_instruction,
  OptionsInstruction
} from "../state";
import useCreateCollection from "./useCreateCollection";
const usePurchaseOption = () => {
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

    toast.success("Successfuly Purchased Option!", {
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

  const PurchaseOption = async (
      asset: PublicKey,
      collection: PublicKey,
      seller: PublicKey
  ) => {
    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });

    if (wallet.signTransaction === undefined) {
      //console.log(wallet, "invalid wallet");
      return;
    }

    if (signature_ws_id.current !== null) {
      //console.log("signature not null");
      alert("Transaction pending, please wait");
      return;
    }

    
    let program_pda = PublicKey.findProgramAddressSync(
      [Buffer.from("pda")],
      PROGRAM,
    )[0];


    const instruction_data = serialise_basic_instruction(
      OptionsInstruction.purchase
    );

    var account_vector = [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: asset, isSigner: false, isWritable: true },
      { pubkey: collection, isSigner: false, isWritable: true },
      { pubkey: program_pda, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: false, isWritable: true },
      { pubkey: CORE, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
    ];

    const purchase_option = new TransactionInstruction({
      keys: account_vector,
      programId: PROGRAM,
      data: instruction_data,
    });

    setIsLoading(true);

    let blockhash_result = await connection.getLatestBlockhash();
    let txArgs = {
      blockhash: blockhash_result.blockhash,
      lastValidBlockHeight: blockhash_result.lastValidBlockHeight,
    };

    let transaction = new Transaction(txArgs);

    transaction.feePayer = wallet.publicKey;


    transaction.add(purchase_option);

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

  return { PurchaseOption, isLoading };
};

export default usePurchaseOption;

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
  Mint,
} from "@solana/spl-token";

import {
  PROGRAM,
  CORE,
  SYSTEM_KEY,
  serialise_CreateCollection_instruction,
  serialise_CreateOption_instruction,
} from "../state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../../common";

import useCreateCollection from "./useCreateCollection";
const useCreateOption = (name: string, uri: string, token_mint: string) => {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState(false);

  const signature_ws_id = useRef<number | null>(null);

  const { GetCreateCollectionInstruction, isLoading: isCollectionLoading } =
    useCreateCollection(name, uri, token_mint);

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

    toast.success("Successfuly Created Option!", {
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

  const CreateOption = async (
    mint: Mint,
    is_2022: boolean,
    side: number,
    token_amount: number,
    strike_price: number,
    option_premium: number,
    end_date: number,
  ) => {
    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });

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

    let token_program = is_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    let token_mint_key = new PublicKey(token_mint);
    //console.log("no lookup data found");
    let collection_account = PublicKey.findProgramAddressSync(
      [token_mint_key.toBytes(), Buffer.from("Collection")],
      PROGRAM,
    )[0];

    let option_keypair = new Keypair();

    let program_pda = PublicKey.findProgramAddressSync(
      [Buffer.from("pda")],
      PROGRAM,
    )[0];

    let user_token_account = getAssociatedTokenAddressSync(
      token_mint_key, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      token_program,
    );

    let program_token_account = getAssociatedTokenAddressSync(
      token_mint_key, // mint
      program_pda, // owner
      true, // allow owner off curve
      token_program,
    );

    let date = new Date(end_date);

    let splitLaunchDate = date.toUTCString().split(" ");
    let launchDateString =
      splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
    let splitLaunchTime = splitLaunchDate[4].split(":");
    let launchTimeString = splitLaunchTime[0] + ":" + splitLaunchTime[1];

    console.log(launchDateString, launchTimeString);

    let option_name =
      (side === 0 ? "CALL " : "PUT ") +
      token_amount.toString() +
      "@" +
      strike_price +
      " Exp " +
      launchDateString +
      " " +
      launchTimeString +
      " UTC";

    let total_tokens = Math.floor(token_amount * Math.pow(10, mint.decimals));
    let strike_lamports = Math.floor(strike_price * Math.pow(10, 9));
    let price_lamports = Math.floor(option_premium * Math.pow(10, 9));

    const instruction_data = serialise_CreateOption_instruction(
      option_name,
      uri,
      total_tokens,
      side,
      end_date,
      strike_lamports,
      price_lamports,
    );

    let transfer_hook = getTransferHook(mint);

    let transfer_hook_program_account: PublicKey | null = null;
    let transfer_hook_validation_account: PublicKey | null = null;
    let extra_hook_accounts: AccountMeta[] = [];
    if (transfer_hook !== null) {
      console.log(transfer_hook.programId.toString());

      transfer_hook_program_account = transfer_hook.programId;
      transfer_hook_validation_account = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.address.toBuffer()],
        transfer_hook_program_account,
      )[0];

      // check if the validation account exists
      console.log("check extra accounts");
      let account_info = await connection.getAccountInfo(
        transfer_hook_validation_account,
      );
      let hook_accounts = account_info.data;

      let extra_account_metas =
        ExtraAccountMetaAccountDataLayout.decode(hook_accounts);

      for (let i = 0; i < extra_account_metas.extraAccountsList.count; i++) {
        let extra = extra_account_metas.extraAccountsList.extraAccounts[i];
        let meta = await resolveExtraAccountMeta(
          connection,
          extra,
          extra_hook_accounts,
          Buffer.from([]),
          transfer_hook_program_account,
        );
        console.log(meta);
        extra_hook_accounts.push(meta);
      }
    }

    var account_vector = [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: option_keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: collection_account, isSigner: false, isWritable: true },
      { pubkey: program_pda, isSigner: false, isWritable: true },
      { pubkey: token_mint_key, isSigner: false, isWritable: true },
      { pubkey: user_token_account, isSigner: false, isWritable: true },
      { pubkey: program_token_account, isSigner: false, isWritable: true },
      { pubkey: CORE, isSigner: false, isWritable: false },
      {
        pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: token_program, isSigner: false, isWritable: true },
      { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
    ];

    if (transfer_hook_program_account !== null) {
      account_vector.push({
        pubkey: transfer_hook_program_account,
        isSigner: false,
        isWritable: true,
      });
      account_vector.push({
        pubkey: transfer_hook_validation_account,
        isSigner: false,
        isWritable: true,
      });

      for (let i = 0; i < extra_hook_accounts.length; i++) {
        account_vector.push({
          pubkey: extra_hook_accounts[i].pubkey,
          isSigner: extra_hook_accounts[i].isSigner,
          isWritable: extra_hook_accounts[i].isWritable,
        });
      }
    }

    const create_option = new TransactionInstruction({
      keys: account_vector,
      programId: PROGRAM,
      data: instruction_data,
    });

    setIsLoading(true);

    let collection_balance = await connection.getBalance(collection_account);
    let create_collection = null;
    if (collection_balance == 0) {
      create_collection = await GetCreateCollectionInstruction();
    }

    let blockhash_result = await connection.getLatestBlockhash();
    let txArgs = {
      blockhash: blockhash_result.blockhash,
      lastValidBlockHeight: blockhash_result.lastValidBlockHeight,
    };

    let transaction = new Transaction(txArgs);

    transaction.feePayer = wallet.publicKey;

    if (create_collection !== null) {
      transaction.add(create_collection);
    }
    transaction.add(create_option);

    transaction.partialSign(option_keypair);

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

  return { CreateOption, isLoading };
};

export default useCreateOption;

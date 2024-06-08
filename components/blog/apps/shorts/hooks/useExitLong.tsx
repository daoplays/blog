import { AMMData, AMMInstruction, PROGRAM } from "../state";

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
  AccountMeta,
  Keypair,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  SYSTEM_KEY,
  DEV_RPC_NODE,
  DEV_WSS_NODE,
  uInt32ToLEBytes,
  CORE,
  serialise_basic_instruction,
} from "../../common";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { ComputeBudgetProgram } from "@solana/web3.js";

import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  getTransferHook,
  resolveExtraAccountMeta,
  ExtraAccountMetaAccountDataLayout,
  unpackMint,
} from "@solana/spl-token";
import { FixableBeetStruct, bignum, u64, u8 } from "@metaplex-foundation/beet";
import { AssetV1 } from "@metaplex-foundation/mpl-core";

const useExitLong = () => {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState(false);

  const signature_ws_id = useRef<number | null>(null);

  const check_signature_update = useCallback(async (result: any) => {
    console.log(result);
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

    toast.success("Exited Long Position!", {
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

  const ExitLong = async (amm_data: AMMData, asset: AssetV1) => {
    const connection = new Connection(DEV_RPC_NODE, {
      wsEndpoint: DEV_WSS_NODE,
    });

    if (wallet.publicKey === null || wallet.signTransaction === undefined)
      return;

    setIsLoading(true);

    const base_mint = amm_data.base_mint;
    const quote_mint = amm_data.quote_mint;

    let base_mint_account = await connection.getAccountInfo(base_mint);
    let quote_mint_account = await connection.getAccountInfo(quote_mint);

    let base_mint_data = unpackMint(
      base_mint,
      base_mint_account,
      base_mint_account.owner,
    );
    let quote_mint_data = unpackMint(
      quote_mint,
      quote_mint_account,
      quote_mint_account.owner,
    );

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

    let user_base = await getAssociatedTokenAddress(
      base_mint, // mint
      wallet.publicKey, // owner
      true, // allow owner off curve
      base_mint_account.owner,
    );

    let amm_base = await getAssociatedTokenAddress(
      base_mint, // mint
      amm_data_account, // owner
      true, // allow owner off curve
      base_mint_account.owner,
    );

    let index_buffer = uInt32ToLEBytes(0);
    let price_data_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
      PROGRAM,
    )[0];

    let asset_address = new PublicKey(asset.publicKey.toString());

    let collection_account = PublicKey.findProgramAddressSync(
      [amm_data_account.toBytes(), Buffer.from("Collection")],
      PROGRAM,
    )[0];

    let pda = PublicKey.findProgramAddressSync(
      [Buffer.from("pda")],
      PROGRAM,
    )[0];

    const instruction_data = serialise_basic_instruction(
      AMMInstruction.exit_long,
    );

    var account_vector = [
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: asset_address, isSigner: false, isWritable: true },
      { pubkey: collection_account, isSigner: false, isWritable: true },
      { pubkey: pda, isSigner: false, isWritable: true },
      { pubkey: amm_data_account, isSigner: false, isWritable: true },
      { pubkey: base_mint, isSigner: false, isWritable: true },
      { pubkey: quote_mint, isSigner: false, isWritable: true },
      { pubkey: user_base, isSigner: false, isWritable: true },
      { pubkey: amm_base, isSigner: false, isWritable: true },
      { pubkey: price_data_account, isSigner: false, isWritable: true },
      { pubkey: CORE, isSigner: false, isWritable: false },
      { pubkey: quote_mint_account.owner, isSigner: false, isWritable: false },
      { pubkey: base_mint_account.owner, isSigner: false, isWritable: false },
      {
        pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
    ];

    const instruction = new TransactionInstruction({
      keys: account_vector,
      programId: PROGRAM,
      data: instruction_data,
    });

    let blockhash_result = await connection.getLatestBlockhash();
    let txArgs = {
      blockhash: blockhash_result.blockhash,
      lastValidBlockHeight: blockhash_result.lastValidBlockHeight,
    };

    let transaction = new Transaction(txArgs);
    transaction.feePayer = wallet.publicKey;

    let feeMicroLamports = 100000;
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: feeMicroLamports,
      }),
    );

    transaction.add(instruction);

    console.log("sending transaction");

    try {
      let signed_transaction = await wallet.signTransaction(transaction);

      var transaction_response = await connection.sendRawTransaction(
        signed_transaction.serialize(),
        { skipPreflight: true },
      );

      let signature = transaction_response;

      console.log("list sig: ", signature);

      connection.onSignature(signature, check_signature_update, "confirmed");
      setTimeout(transaction_failed, 20000);
    } catch (error) {
      setIsLoading(false);
      toast.error("Market order failed, please try again", {
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return { ExitLong, isLoading };
};

export default useExitLong;

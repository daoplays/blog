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
    serialise_basic_instruction,
    OptionsInstruction,
} from "../state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../../common";

const useExecuteOption = () => {
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

        toast.success("Successfuly Executed Option!", {
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

    const ExecuteOption = async (
        base_2022: boolean,
        base_mint: Mint,
        quote_2022: boolean,
        quote_mint: Mint,
        asset: PublicKey,
        collection: PublicKey,
        creator: PublicKey,
        token: PublicKey,
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

        let base_token_program = base_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
        let quote_token_program = quote_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

        let program_pda = PublicKey.findProgramAddressSync([Buffer.from("pda")], PROGRAM)[0];

        let user_base = getAssociatedTokenAddressSync(
            token, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_token_program,
        );

        let program_base = getAssociatedTokenAddressSync(
            token, // mint
            program_pda, // owner
            true, // allow owner off curve
            base_token_program,
        );

        let creator_base = getAssociatedTokenAddressSync(
            token, // mint
            creator, // owner
            true, // allow owner off curve
            base_token_program,
        );

        let user_quote = getAssociatedTokenAddressSync(
            quote_mint.address, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            quote_token_program,
        );

        let program_quote = getAssociatedTokenAddressSync(
            quote_mint.address, // mint
            program_pda, // owner
            true, // allow owner off curve
            quote_token_program,
        );

        let creator_quote = getAssociatedTokenAddressSync(
            quote_mint.address, // mint
            creator, // owner
            true, // allow owner off curve
            quote_token_program,
        );

        const instruction_data = serialise_basic_instruction(OptionsInstruction.execute);

        let transfer_hook = getTransferHook(base_mint);

        let transfer_hook_program_account: PublicKey | null = null;
        let transfer_hook_validation_account: PublicKey | null = null;
        let extra_hook_accounts: AccountMeta[] = [];
        if (transfer_hook !== null) {
            console.log(transfer_hook.programId.toString());

            transfer_hook_program_account = transfer_hook.programId;
            transfer_hook_validation_account = PublicKey.findProgramAddressSync(
                [Buffer.from("extra-account-metas"), base_mint.address.toBuffer()],
                transfer_hook_program_account,
            )[0];

            // check if the validation account exists
            console.log("check extra accounts");
            let account_info = await connection.getAccountInfo(transfer_hook_validation_account);
            let hook_accounts = account_info.data;

            let extra_account_metas = ExtraAccountMetaAccountDataLayout.decode(hook_accounts);

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
            { pubkey: asset, isSigner: false, isWritable: true },
            { pubkey: collection, isSigner: false, isWritable: true },
            { pubkey: program_pda, isSigner: false, isWritable: true },
            { pubkey: base_mint.address, isSigner: false, isWritable: true },
            { pubkey: quote_mint.address, isSigner: false, isWritable: true },
            { pubkey: user_base, isSigner: false, isWritable: true },
            { pubkey: user_quote, isSigner: false, isWritable: true },
            { pubkey: program_base, isSigner: false, isWritable: true },
            { pubkey: program_quote, isSigner: false, isWritable: true },

            { pubkey: creator, isSigner: false, isWritable: true },
            { pubkey: creator_base, isSigner: false, isWritable: true },
            { pubkey: creator_quote, isSigner: false, isWritable: true },

            { pubkey: CORE, isSigner: false, isWritable: false },
            {
                pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: base_token_program, isSigner: false, isWritable: true },
            { pubkey: quote_token_program, isSigner: false, isWritable: true },
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

            var transaction_response = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            let signature = transaction_response;

            console.log("collection sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { ExecuteOption, isLoading };
};

export default useExecuteOption;

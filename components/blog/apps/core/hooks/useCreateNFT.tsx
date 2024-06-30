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
import { PROGRAM, CORE, SYSTEM_KEY, serialise_CreateAsset_instruction } from "../state";
import { DEV_RPC_NODE, DEV_WSS_NODE } from "../../common";

const useCreateNFT = (name: string, uri: string, collection: PublicKey, setNFT: Dispatch<SetStateAction<PublicKey>>) => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);
    const NFTRef = useRef<PublicKey | null>(null);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(
        async (result: any) => {
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

            toast.success("Successfuly Created NFT!", {
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            setNFT(NFTRef.current);
        },
        [setNFT],
    );

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

    const CreateNFT = async () => {
        //console.log("in mint nft");

        if (wallet.signTransaction === undefined) {
            //console.log(wallet, "invalid wallet");
            return;
        }

        if (signature_ws_id.current !== null) {
            //console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(DEV_RPC_NODE, {
            wsEndpoint: DEV_WSS_NODE,
        });

        setIsLoading(true);
        //console.log("no lookup data found");
        let nft_keypair = new Keypair();
        let nft_pubkey = nft_keypair.publicKey;
        NFTRef.current = nft_pubkey;

        const instruction_data = serialise_CreateAsset_instruction(1, name, uri);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_pubkey, isSigner: true, isWritable: true },
            { pubkey: collection, isSigner: false, isWritable: true },
            { pubkey: CORE, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        ];

        const list_instruction = new TransactionInstruction({
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

        transaction.add(list_instruction);

        transaction.partialSign(nft_keypair);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var transaction_response = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            let signature = transaction_response;

            console.log("collection sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            toast.error("Error sending transaction, please try again", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { CreateNFT, isLoading };
};

export default useCreateNFT;

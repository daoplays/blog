import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { GetVoteInstruction } from "../instructions/Vote";
import { get_current_blockhash, send_transaction } from "../components/state/rpc";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { GetClaimPrizeInstruction } from "../instructions/ClaimPrize";

const useClaimPrize = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

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

        toast.success("Transaction Successfull!", {
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

    const ClaimPrize = async (game: number, date: number) => {
        console.log("in vote");

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (signature_ws_id.current !== null) {
            console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        setIsLoading(true);

        let instructions = await GetClaimPrizeInstruction(wallet.publicKey, game, date);

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        for (let i = 0; i < instructions.length; i++) {
            transaction.add(instructions[i]);
        }

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("wrap nft sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { ClaimPrize, isLoading };
};

export default useClaimPrize;

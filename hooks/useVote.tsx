import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { GetVoteInstruction } from "../instructions/Vote";
import { get_current_blockhash, send_transaction } from "../components/state/rpc";
import { Context, PublicKey, SignatureResult, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { showTransactionToast } from "../components/state/transactionToast";
import { PROGRAM, TIMEOUT } from "../components/state/constants";
import { ToastControls } from "../components/state/interfaces";

const useVote = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);
    const toastControlsRef = useRef<ToastControls | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cleanupListeners = () => {
        if (signature_ws_id.current !== null) {
            connection.removeSignatureListener(signature_ws_id.current);
            signature_ws_id.current = null;
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const check_signature_update = useCallback((result: SignatureResult, context: Context) => {
        if (!toastControlsRef.current) return;

        const { setStatus, setError, closeToast } = toastControlsRef.current;

        cleanupListeners();

        if (result.err) {
            setError("execution_failed");
        } else {
            setStatus("Confirmed");
        }
    }, []);

    const Vote = async (creator: PublicKey, game: number, vote: number) => {
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

        toastControlsRef.current = showTransactionToast();
        const { setStatus, setError } = toastControlsRef.current;

        try {
            setStatus("Signing");

            let instructions = await GetVoteInstruction(wallet.publicKey, creator, game, vote, PROGRAM);

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            for (let i = 0; i < instructions.length; i++) {
                transaction.add(instructions[i]);
            }

            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());
            setStatus("Sending");

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("wrap nft sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            // Set up a 30-second timeout
            timeoutRef.current = setTimeout(() => {
                cleanupListeners();
                setError("Failed to process");
            }, TIMEOUT);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            cleanupListeners();
            setError((error as Error).message);
            return;
        }
    };

    return { Vote, isLoading };
};

export default useVote;

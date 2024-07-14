import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "../components/state/rpc";
import { ComputeBudgetProgram, Connection, Context, PublicKey, SignatureResult, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { showTransactionToast } from "../components/state/transactionToast";
import { PROGRAM, TIMEOUT } from "../components/state/constants";
import { ToastControls } from "../components/state/interfaces";
import { WebIrys } from "@irys/sdk";
import { Config } from "../components/state/constants";

type Tag = {
    name: string;
    value: string;
};

const useUploadImage = () => {
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

    const UploadImage = async (image: File) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const irys_wallet = { name: "phantom", provider: wallet };
        const irys = new WebIrys({
            url: Config.IRYS_URL,
            token: "solana",
            wallet: irys_wallet,
            config: {
                providerUrl: Config.RPC_NODE,
            },
        });

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        let price = await irys.getPrice(Math.floor(image.size * 1.2));

        try {
            let txArgs = await get_current_blockhash("");

            var tx = new Transaction(txArgs).add(
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: new PublicKey(Config.IRYS_WALLET),
                    lamports: Number(price),
                }),
            );
            tx.feePayer = wallet.publicKey;
            let signed_transaction = await wallet.signTransaction(tx);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);

            let signature = transaction_response.result;

            let fund_check = await irys.funder.submitFundTransaction(signature);

            console.log(fund_check, fund_check.data["confirmed"]);

            toast.success("Your account has been successfully funded.");
        } catch (error) {
            toast.error("Oops! Something went wrong during funding. Please try again later. ");
            return;
        }

        const tags: Tag[] = [{ name: "Content-Type", value: image.type }];

        const uploadToArweave = toast.info("Sign to upload images on Arweave.");

        let receipt;

        try {
            receipt = await irys.uploadFolder([image], {
                //@ts-ignore
                tags,
            });
            toast.update(uploadToArweave, {
                render: `Images have been uploaded successfully!
                View: https://gateway.irys.xyz/${receipt.id}`,
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });
        } catch (error) {
            toast.error(`Failed to upload images, please try again later.`);

            return;
        }

        console.log(receipt);

        let icon_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[image.name].id;
        console.log("image url", icon_url);
    };

    return { UploadImage };
};

export default useUploadImage;

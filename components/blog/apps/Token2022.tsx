import React, { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { SetStateAction } from "react";

import { Box, HStack, Text, Center, VStack, NumberInput, NumberInputField, Divider, Image, Input } from "@chakra-ui/react";
import { isMobile } from "react-device-detect";

import { PublicKey, Keypair, clusterApiUrl, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, useWalletModal } from "@solana/wallet-adapter-react-ui";

import { BeetStruct, u8, u16, u64, i16, bignum, utf8String, FixableBeetStruct } from "@metaplex-foundation/beet";
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getTransferFeeAmount,
    unpackAccount,
    createWithdrawWithheldTokensFromAccountsInstruction,
    createAmountToUiAmountInstruction,
    createThawAccountInstruction,
    createMintToCheckedInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import BN from "bn.js";

import loading from "./loading-gif.gif";

require("@solana/wallet-adapter-react-ui/styles.css");

async function postData(url = "", bearer = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}


interface BasicReply {
    id: number;
    jsonrpc: string;
    result: string;
    error: string;
}

export function check_json(json_response: BasicReply): boolean {
    if (json_response.result === undefined) {
        if (json_response.error !== undefined) {
            console.log(json_response.error);
        }
        return false;
    }

    if (json_response.result === null) return false;

    return true;
}

interface TransactionResponseData {
    id: number;
    jsonrpc: string;
    result: string;
}

async function send_transaction(bearer: string, encoded_transaction: string): Promise<TransactionResponseData> {
    var body = { id: 1, jsonrpc: "2.0", method: "sendTransaction", params: [encoded_transaction, { skipPreflight: true }] };

    const DEV_RPC_NODE = "https://black-damp-river.solana-devnet.quiknode.pro/c5447e06dd58dec2f4568518d8fb2fd8625b1d95/";

    
    var response_json = await postData(DEV_RPC_NODE, bearer, body);
    console.log(response_json);
    let transaction_response: TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    transaction_response.result = "INVALID";
    return transaction_response;
}

const button_width = "150px";

const PROGRAM = new PublicKey("DUTVNGBNfAmx5QEFVyCJvEpEusUBHndCAVTWEThDV4oG");
const HOOK_PROGRAM = new PublicKey("vyyNeAorB3Ce4nyfBK4dL7CMu9Jx2M9vK8zBGvFrpYd");


const TokenInstruction = {
    create_token: 0,
    transfer: 1
};

const Extensions = {
    None: 0,
    TransferFee: 1,
    PermanentDelegate: 2,
    InterestBearing: 4,
    NonTransferable: 8,
    DefaultState: 16,
    TransferHook: 32,
    MetaData: 64,
    Collection: 128,
};

class Create_Token_Instruction {
    constructor(
        readonly instruction: number,
        readonly extensions: number,
        readonly transfer_fee_bp: number,
        readonly transfer_fee_max: bignum,
        readonly interest_rate: number,
        readonly name: string,
        readonly symbol: string,
        readonly uri: string,


    ) {}

    static readonly struct = new FixableBeetStruct<Create_Token_Instruction>(
        [
            ["instruction", u8],
            ["extensions", u64],
            ["transfer_fee_bp", u16],
            ["transfer_fee_max", u64],
            ["interest_rate", i16],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],

        ],
        (args) =>
            new Create_Token_Instruction(
                args.instruction!,
                args.extensions!,
                args.transfer_fee_bp!,
                args.transfer_fee_max!,
                args.interest_rate!,
                args.name!,
                args.symbol!,
                args.uri!

            ),
        "Create_Token_Instruction",
    );
}

class Transfer_Token_Instruction {
    constructor(
        readonly instruction: number,
        readonly quantity: bignum
    ) {}

    static readonly struct = new BeetStruct<Transfer_Token_Instruction>(
        [
            ["instruction", u8],
            ["quantity", u64]
        ],
        (args) =>
            new Transfer_Token_Instruction(
                args.instruction!,
                args.quantity!
            ),
        "Transfer_Token_Instruction",
    );
}

class MintCounter {
    constructor(
        readonly counter: bignum,
    ) {}

    static readonly struct = new BeetStruct<MintCounter>(
        [
            ["counter", u64]
        ],
        (args) => new MintCounter(args.counter!),
        "MintCounter",
    );
}

function dec2bin(dec: number) {
    return (dec >>> 0).toString(2);
}

function TextInputBox({
    setValue,
    display_value,
    key_string,
    current_ref,
}: {
    setValue: React.Dispatch<SetStateAction<string>>;
    display_value: string;
    key_string: string;
    current_ref: React.RefObject<HTMLInputElement>;
}) {
    return (
        <HStack alignItems="center">
            <Text width="200px" mb="0">{key_string}</Text>
            <Input
                ref={current_ref}
                maxLength={250}
                autoFocus={current_ref?.current === document.activeElement}
                height="20px"
                width="200px"
                paddingTop="1rem"
                paddingBottom="1rem"
                borderColor="black"
                value={display_value}
                onChange={(e) => {
                    setValue(e.target.value);
                }}
            />
        </HStack>
    );
}

function NumberInputBox({
    setValue,
    display_value,
    key_string,
    current_ref,
}: {
    setValue: React.Dispatch<SetStateAction<number>>;
    display_value: string;
    key_string: string;
    current_ref: React.RefObject<HTMLInputElement>;
}) {
    return (
        <HStack alignItems="center">
            <Text mb="0">{key_string}</Text>
            <NumberInput
                key={key_string}
                id={key_string}
                color="black"
                size="lg"
                onChange={(valueString) => {
                    setValue(!isNaN(parseInt(valueString)) ? parseInt(valueString) : 0);
                }}
                value={display_value}
                borderColor="black"
                min={0}
                max={30000}
            >
                <NumberInputField
                    ref={current_ref}
                    key={key_string + "_field"}
                    autoFocus={current_ref?.current === document.activeElement}
                    height="20px"
                    width="80px"
                    paddingTop="1rem"
                    paddingBottom="1rem"
                    borderColor="black"
                />
            </NumberInput>
        </HStack>
    );
}

interface TransferAccount {
    pubkey: PublicKey;
    amount: number;
}

function Tokens2022App() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const current_signature = useRef<string | null>(null);
    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    // keypair we will use to make transactions
    const [temp_keypair, setTempKeypair] = useState<Keypair | null>(null);

    // token states
    const [include_transfer, setIncludeTransfer] = useState<boolean>(false);
    const [include_delegate, setIncludeDelegate] = useState<boolean>(false);
    const [include_interest, setIncludeInterest] = useState<boolean>(false);
    const [include_soulbound, setIncludeSoulbound] = useState<boolean>(false);
    const [include_default, setIncludeDefault] = useState<boolean>(false);
    const [include_hook, setIncludeHook] = useState<boolean>(false);
    const [include_metadata, setIncludeMetaData] = useState<boolean>(false);

    const [account_frozen, setAccountFrozen] = useState<boolean>(false);

    const [current_mint, setCurrentMint] = useState<PublicKey | null>(null);
    const [mint_created, setMintCreated] = useState<boolean>(false);

    const [transfer_fee_bp, setTransferFeeBP] = useState<number>(500);
    const [transfer_fee_max, setTransferFeeMax] = useState<number>(5000);
    const [interest_rate, setInterestRate] = useState<number>(10000);

    const [name, setName] = useState<string>("");
    const [symbol, setSymbol] = useState<string>("");
    const [uri, setURI] = useState<string>("");


    const [hook_transfers, setHookTransfers] = useState<number>(0);
    const check_hook_transfers = useRef<boolean>(false);


    const transfer_fee_bp_ref = useRef<HTMLInputElement>(null);
    const transfer_fee_max_ref = useRef<HTMLInputElement>(null);
    const interest_rate_ref = useRef<HTMLInputElement>(null);

    const name_rate_ref = useRef<HTMLInputElement>(null);
    const symbol_ref = useRef<HTMLInputElement>(null);
    const uri_ref = useRef<HTMLInputElement>(null);


    const state_interval = useRef<number | null>(null);
    const check_keypair_interval = useRef<number | null>(null);
    const check_keypair = useRef<boolean>(true);

    //transfer fee state
    const [transfer_accounts, setTransferAccounts] = useState<TransferAccount[]>([]);

    // interest rate state
    const [token_balance, setTokenBalance] = useState<number>(0);
    const [tokenUIbalance, setTokenUIBalance] = useState<number>(0);

    function ConnectWalletButton() {
        const { setVisible } = useWalletModal();

        const handleConnectWallet = useCallback(async () => {
            setVisible(true);
        }, [setVisible]);

        return (
            <>
                <Box mb="1rem" as="button" onClick={handleConnectWallet}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="160px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            CONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    const DisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
    }, [wallet]);

    function DisconnectWalletButton() {
        return (
            <>
                <Box mb="1rem" as="button" onClick={() => DisconnectWallet()}>
                    <div className="font-face-sfpb">
                        <Text
                            borderColor="black"
                            borderWidth="1px"
                            width="200px"
                            height="25px"
                            fontSize={"16px"}
                            textAlign="center"
                            color="black"
                            mb="0"
                        >
                            DISCONNECT WALLET
                        </Text>
                    </div>
                </Box>
            </>
        );
    }

    const CheckTempKeypair = useCallback(async () => {
        if (temp_keypair === null) return;

        if (check_keypair.current === true) {

            let balance = await connection.getBalance(temp_keypair.publicKey, "confirmed");

            if (balance === 0) return;

            console.log("account has been created");
            check_keypair.current = false;
        }

        if (check_hook_transfers.current === true) {
            let mint_data_account = await PublicKey.findProgramAddressSync([Buffer.from("mint_data"), current_mint.toBytes()], HOOK_PROGRAM);
            try {
                let program_data_account = await connection.getAccountInfo(mint_data_account[0]);
                const [counter] = MintCounter.struct.deserialize(program_data_account.data);
    
                let counter_val = new BN(counter.counter).toNumber();
                if (hook_transfers !== counter_val) {
                    setHookTransfers(counter_val);
                    console.log("account data:", counter_val);
                    check_hook_transfers.current = false;
                }

            } catch (error) {
                console.log(error);
            }

        }

    }, [temp_keypair, current_mint, connection, hook_transfers]);

    // interval for checking signatures
    useEffect(() => {
        if (check_keypair_interval.current === null) {
            check_keypair_interval.current = window.setInterval(CheckTempKeypair, 1000);
        } else {
            window.clearInterval(check_keypair_interval.current);
            check_keypair_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (check_keypair_interval.current !== null) {
                window.clearInterval(check_keypair_interval.current);
                check_keypair_interval.current = null;
            }
        };
    }, [CheckTempKeypair]);

    useEffect(() => {
        console.log("wallet changed", wallet.connected, wallet.connecting, wallet.disconnecting, wallet.publicKey === null);
    }, [wallet]);

    const GetFeeAccounts = useCallback(async () => {
        if (current_mint === null) return;
        const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: current_mint.toString(),
                    },
                },
            ],
        });

        const accountsToWithdrawFrom = [];
        for (const accountInfo of allAccounts) {
            const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
            const transferFeeAmount = getTransferFeeAmount(account);
            if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
                let transfer_account: TransferAccount = {
                    pubkey: accountInfo.pubkey,
                    amount: parseInt(transferFeeAmount.withheldAmount.toString()) / 1000,
                };
                console.log(accountInfo.pubkey.toString(), (parseInt(transferFeeAmount.withheldAmount.toString()) / 1000).toString());
                accountsToWithdrawFrom.push(transfer_account);
            }
        }

        console.log(allAccounts);
        console.log(accountsToWithdrawFrom);
        setTransferAccounts(accountsToWithdrawFrom);
    }, [connection, current_mint]);

    const GetTokenAmounts = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null || temp_keypair === null) return;

        await GetFeeAccounts();

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let accountInfo = await connection.getAccountInfo(user_token_key, "processed");
        if (accountInfo === null) return;

        setMintCreated(true);
        setProcessingTransaction(false);

        const account = unpackAccount(user_token_key, accountInfo, TOKEN_2022_PROGRAM_ID);

        console.log("frozen? ", account.isFrozen);
        setAccountFrozen(account.isFrozen);

        let current_balance = await connection.getTokenAccountBalance(user_token_key, "processed");
        console.log(current_balance, parseInt(current_balance.value.amount));
        const transaction = new Transaction().add(
            createAmountToUiAmountInstruction(current_mint, parseInt(current_balance.value.amount), TOKEN_2022_PROGRAM_ID),
        );
        const { returnData, err } = (await connection.simulateTransaction(transaction, [temp_keypair], false)).value;

        if (!returnData?.data) {
            console.log("no returnData", returnData);
            console.log(err);
            return;
        }
        let ui_amount = Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8");
        console.log(current_balance, Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8"));

        if (current_balance.value.uiAmount !== null) setTokenBalance(current_balance.value.uiAmount);
        setTokenUIBalance(parseFloat(ui_amount));
        return Buffer.from(returnData.data[0], returnData.data[1]).toString("utf-8");
    }, [wallet, connection, current_mint, temp_keypair, GetFeeAccounts]);

    useEffect(() => {
        if (state_interval.current === null) {
            state_interval.current = window.setInterval(GetTokenAmounts, 5000);
        } else {
            window.clearInterval(state_interval.current);
            state_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (state_interval.current !== null) {
                window.clearInterval(state_interval.current);
                state_interval.current = null;
            }
        };
    }, [GetTokenAmounts]);

    const Transfer = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null || wallet.signTransaction === undefined) return;

        const accountKeypair = Keypair.generate();

        console.log("Create account for ", accountKeypair.publicKey.toString());

        const lamports = await connection.getMinimumBalanceForRentExemption(0);

        let create_account_idx = SystemProgram.createAccount({
            /** The account that will transfer lamports to the created account */
            fromPubkey: wallet.publicKey,
            /** Public key of the created account */
            newAccountPubkey: accountKeypair.publicKey,
            /** Amount of lamports to transfer to the created account */
            lamports: lamports,
            /** Amount of space in bytes to allocate to the created account */
            space: 0,
            /** Public key of the program to assign as the owner of the created account */
            programId: SystemProgram.programId,
        });

        let new_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            accountKeypair.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        console.log("Create token account at ", new_token_key.toString());

        let create_ata_idx = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            new_token_key,
            accountKeypair.publicKey,
            current_mint,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let init_address = PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), current_mint.toBytes()], HOOK_PROGRAM)[0];
        let mint_data_address = PublicKey.findProgramAddressSync([Buffer.from("mint_data"), current_mint.toBytes()], HOOK_PROGRAM)[0];

        const idx_data = new Transfer_Token_Instruction(
            TokenInstruction.transfer,
            1000
        );
        const [idx_buffer] = Transfer_Token_Instruction.struct.serialize(idx_data);

        console.log("Transfer idx")
        console.log(current_mint.toString());
        console.log(init_address.toString());
        console.log(mint_data_address.toString());

        const transfer_token_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: user_token_key, isSigner: false, isWritable: true },
                { pubkey: new_token_key, isSigner: false, isWritable: true },
                { pubkey: current_mint, isSigner: false, isWritable: true },

                { pubkey: HOOK_PROGRAM, isSigner: false, isWritable: false },
                { pubkey: init_address, isSigner: false, isWritable: true },
                { pubkey: mint_data_address, isSigner: false, isWritable: true },

                { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }


            ],
            programId: PROGRAM,
            data: idx_buffer,
        });
        

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(create_account_idx);
        transaction.add(create_ata_idx);

        if (include_default) {
            let thaw_idx = createThawAccountInstruction(new_token_key, current_mint, wallet.publicKey, undefined, TOKEN_2022_PROGRAM_ID);
            transaction.add(thaw_idx);
        }


        console.log("mint ", current_mint.toString());
        console.log("source ", user_token_key.toString());
        console.log("dest wallet ", accountKeypair.publicKey.toString());
        console.log("dest token ", new_token_key.toString());

        transaction.add(transfer_token_instruction);

        transaction.partialSign(accountKeypair);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);
        } catch (error) {
            console.log(error);
        }

        if (include_hook) {
            check_hook_transfers.current = true;
        }

        setProcessingTransaction(true);
    }, [wallet, connection, current_mint, include_default, include_hook]);

    const GetFees = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null || transfer_accounts.length === 0) return;

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let accountsToWithdrawFrom = [];
        for (let i = 0; i < transfer_accounts.length; i++) {
            accountsToWithdrawFrom.push(transfer_accounts[i].pubkey);
        }

        let withdraw_idx = createWithdrawWithheldTokensFromAccountsInstruction(
            current_mint,
            user_token_key,
            wallet.publicKey,
            [],
            accountsToWithdrawFrom,
            TOKEN_2022_PROGRAM_ID,
        );

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(withdraw_idx);

        try {
            await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
        }

        setProcessingTransaction(true);
    }, [wallet, connection, current_mint, transfer_accounts]);

    const Create = useCallback(async () => {
        if (wallet.publicKey === null) return;

        const accountKeypair = Keypair.generate();



        let space = 100;
        const lamports = await connection.getMinimumBalanceForRentExemption(space);
        console.log("Create account for ", accountKeypair.publicKey.toString(), lamports / LAMPORTS_PER_SOL);

        let create_account_idx = SystemProgram.createAccount({
            /** The account that will transfer lamports to the created account */
            fromPubkey: wallet.publicKey,
            /** Public key of the created account */
            newAccountPubkey: accountKeypair.publicKey,
            /** Amount of lamports to transfer to the created account */
            lamports: lamports,
            /** Amount of space in bytes to allocate to the created account */
            space: 0,
            /** Public key of the program to assign as the owner of the created account */
            programId: SystemProgram.programId,
        });

        const mint_keypair = Keypair.generate();
        var mint_pubkey = mint_keypair.publicKey;

        let user_token_key = await getAssociatedTokenAddress(
            mint_pubkey, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let init_address = PublicKey.findProgramAddressSync([Buffer.from("extra-account-metas"), mint_pubkey.toBytes()], HOOK_PROGRAM)[0];
        let mint_data_address = PublicKey.findProgramAddressSync([Buffer.from("mint_data"), mint_pubkey.toBytes()], HOOK_PROGRAM)[0];


        let extensions =
            (Extensions.TransferFee * Number(include_transfer)) |
            (Extensions.PermanentDelegate * Number(include_delegate)) |
            (Extensions.InterestBearing * Number(include_interest)) |
            (Extensions.NonTransferable * Number(include_soulbound)) |
            (Extensions.DefaultState * Number(include_default)) |
            (Extensions.TransferHook * Number(include_hook)) |
            (Extensions.MetaData * Number(include_metadata));

        console.log(dec2bin(Extensions.TransferFee));
        console.log(dec2bin(Extensions.PermanentDelegate));
        console.log(dec2bin(Extensions.InterestBearing));
        console.log(dec2bin(Extensions.NonTransferable));
        console.log(dec2bin(Extensions.DefaultState));
        console.log(dec2bin(extensions));

        const idx_data = new Create_Token_Instruction(
            TokenInstruction.create_token,
            extensions,
            transfer_fee_bp,
            transfer_fee_max,
            interest_rate,
            name,
            symbol,
            uri
        );
        const [idx_buffer] = Create_Token_Instruction.struct.serialize(idx_data);

        const create_token_instruction = new TransactionInstruction({
            keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

                { pubkey: mint_pubkey, isSigner: true, isWritable: true },
                { pubkey: user_token_key, isSigner: false, isWritable: true },
                { pubkey: HOOK_PROGRAM, isSigner: false, isWritable: false },
                { pubkey: init_address, isSigner: false, isWritable: true },

                { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: true },

                { pubkey: mint_data_address, isSigner: false, isWritable: true },

            ],
            programId: PROGRAM,
            data: idx_buffer,
        });

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(create_account_idx);
        transaction.add(create_token_instruction);

        //console.log("signing with ", team_token_mint_keypair.publicKey.toString());
        transaction.partialSign(accountKeypair);
        transaction.partialSign(mint_keypair);

        let signature = null;
        try {
            signature = await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
            return;
        }

        setCurrentMint(mint_keypair.publicKey);
        setTempKeypair(accountKeypair);
        setMintCreated(false);

        setProcessingTransaction(true);
        current_signature.current = signature;
    }, [
        wallet,
        connection,
        include_transfer,
        include_delegate,
        include_interest,
        include_soulbound,
        include_default,
        include_hook,
        include_metadata,
        transfer_fee_bp,
        transfer_fee_max,
        interest_rate,
        name,
        symbol,
        uri
    ]);

    const ThawAccount = useCallback(async () => {
        if (wallet.publicKey === null || current_mint === null) return;

        let user_token_key = await getAssociatedTokenAddress(
            current_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let thaw_idx = createThawAccountInstruction(user_token_key, current_mint, wallet.publicKey, undefined, TOKEN_2022_PROGRAM_ID);

        let mint_idx = createMintToCheckedInstruction(
            current_mint,
            user_token_key,
            wallet.publicKey,
            1000 * 1000,
            3,
            undefined,
            TOKEN_2022_PROGRAM_ID,
        );

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = { blockhash: blockhash_result.blockhash, lastValidBlockHeight: blockhash_result.lastValidBlockHeight };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(thaw_idx);
        transaction.add(mint_idx);

        try {
            await wallet.sendTransaction(transaction, connection);
        } catch (error) {
            console.log(error);
        }
    }, [wallet, connection, current_mint]);

    function TokenFunctions() {
        if (current_mint === null || mint_created === false) {
            return <></>;
        }
        // if the account is frozen then there isn't much to do but unfreeze
        if (include_default && account_frozen) {
            return (
                <>
                    <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                    <Box width={button_width} as="button" onClick={() => ThawAccount()} borderWidth="1px" borderColor="black">
                        Unfreeze
                    </Box>
                </>
            );
        }

        if (include_transfer || include_hook) {
            return (
                <>
                    <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                    <Box width={button_width} as="button" onClick={() => Transfer()} borderWidth="1px" borderColor="black">
                        Transfer 1
                    </Box>
                    {transfer_accounts.length > 0 && (
                        <>
                            <VStack>
                                {transfer_accounts.map((item: TransferAccount, index) => (
                                    <Text key={index} mb="0">
                                        {item.pubkey.toString().slice(0, 5) + "..."} withheld {item.amount}
                                    </Text>
                                ))}
                            </VStack>
                            <Box width={button_width} as="button" onClick={() => GetFees()} borderWidth="1px" borderColor="black">
                                Claim Fees
                            </Box>
                        </>
                    )}
                </>
            );
        }

        return <></>;
    }

    function IncludeTransfer() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeTransfer(!include_transfer)}
                borderWidth="1px"
                borderColor={include_transfer ? "black" : "white"}
            >
                Transfer Fee
            </Box>
        );
    }

    function IncludeDelegate() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeDelegate(!include_delegate)}
                borderWidth="1px"
                borderColor={include_delegate ? "black" : "white"}
            >
                Delegate
            </Box>
        );
    }

    function IncludeNonTransferable() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeSoulbound(!include_soulbound)}
                borderWidth="1px"
                borderColor={include_soulbound ? "black" : "white"}
            >
                Non-Transferable
            </Box>
        );
    }

    function IncludeInterest() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeInterest(!include_interest)}
                borderWidth="1px"
                borderColor={include_interest ? "black" : "white"}
            >
                Interest
            </Box>
        );
    }

    function IncludeDefaultState() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeDefault(!include_default)}
                borderWidth="1px"
                borderColor={include_default ? "black" : "white"}
            >
                Default State
            </Box>
        );
    }

    function IncludeHook() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeHook(!include_hook)}
                borderWidth="1px"
                borderColor={include_hook ? "black" : "white"}
            >
                Transfer Hook
            </Box>
        );
    }

    function IncludeMetaData() {
        return (
            <Box
                width={button_width}
                as="button"
                onClick={() => setIncludeMetaData(!include_metadata)}
                borderWidth="1px"
                borderColor={include_metadata ? "black" : "white"}
            >
                Metadata
            </Box>
        );
    }

    function SetTokenOptions() {
        return (
            <Center mb="5rem" width="100%">
                <VStack>
                    {!isMobile && (
                        <HStack>
                            <IncludeTransfer />
                            <IncludeDelegate />
                            <IncludeInterest />
                            <IncludeNonTransferable />
                            <IncludeDefaultState />
                            <IncludeHook />
                            <IncludeMetaData />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeTransfer />
                            <IncludeDelegate />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeInterest />
                            <IncludeNonTransferable />
                        </HStack>
                    )}
                    {isMobile && (
                        <HStack>
                            <IncludeDefaultState />
                        </HStack>
                    )}
                    {include_metadata && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                            <Text width="100%" textAlign={"left"}>
                                MetaData Options
                            </Text>
                            <VStack width="100%" align="left">
                                <TextInputBox
                                    setValue={setName}
                                    display_value={name}
                                    key_string="Token Name"
                                    current_ref={name_rate_ref}
                                />

                                <TextInputBox
                                    setValue={setSymbol}
                                    display_value={symbol}
                                    key_string="Token Symbol"
                                    current_ref={symbol_ref}
                                />

                                <TextInputBox
                                    setValue={setURI}
                                    display_value={uri}
                                    key_string="Token URI"
                                    current_ref={uri_ref}
                                />
                            </VStack>
                        </>
                    )}
                    {include_transfer && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                            <Text width="100%" textAlign={"left"}>
                                Transfer Fee Options
                            </Text>
                            <HStack width="100%">
                                <NumberInputBox
                                    setValue={setTransferFeeBP}
                                    display_value={transfer_fee_bp.toFixed(0)}
                                    key_string="Transfer fee basis points"
                                    current_ref={transfer_fee_bp_ref}
                                />

                                <NumberInputBox
                                    setValue={setTransferFeeMax}
                                    display_value={transfer_fee_max.toFixed(0)}
                                    key_string="Transfer fee maximum"
                                    current_ref={transfer_fee_max_ref}
                                />
                            </HStack>
                        </>
                    )}
                    {include_interest && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                            <Text width="100%" textAlign={"left"}>
                                Interest Rate Options
                            </Text>
                            <Box width="100%">
                                <NumberInputBox
                                    setValue={setInterestRate}
                                    display_value={interest_rate.toFixed(0)}
                                    key_string="Interest rate"
                                    current_ref={interest_rate_ref}
                                />
                            </Box>
                        </>
                    )}
                    <>
                        <Divider color={"black"} borderBottomWidth="2px" opacity={1} />
                        <Text width="100%" textAlign={"left"}>
                            Click to create your token:
                        </Text>
                        <Box width={button_width} as="button" onClick={() => Create()} borderWidth="1px" borderColor="black">
                            Create
                        </Box>

                        {current_mint !== null && (
                            <VStack>
                                <Text mb="0" textAlign={"center"}>
                                    Token Mint: {current_mint.toString().slice(0, 5) + "..."}
                                </Text>{" "}
                                <Text mb="0" textAlign="center" color="black">
                                    View it{" "}
                                    <a
                                        className="one"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ textDecoration: "underline" }}
                                        href={"https://explorer.solana.com/address/" + current_mint.toString() + "?cluster=devnet"}
                                    >
                                        here
                                    </a>
                                </Text>
                            </VStack>
                        )}
                    </>
                    <TokenFunctions />

                    {current_mint !== null && !account_frozen && mint_created && (
                        <>
                            <Divider color={"black"} borderBottomWidth="2px" opacity={1} />

                            <Text>Actual Token Balance: {token_balance}</Text>
                            <Text>UI Token Balance (with interest): {tokenUIbalance}</Text>
                        </>
                    )}

                    {current_mint !== null && !account_frozen && mint_created && include_hook && (
                         <>
                         <Divider color={"black"} borderBottomWidth="2px" opacity={1} />

                         <Text>Transfer Hook Counter: {hook_transfers}</Text>
                     </>
                    )}

                    {processing_transaction && <Image src={loading.src} width="50px" alt={""} />}
                </VStack>
            </Center>
        );
    }

    return (
        <>
            {wallet.publicKey && <DisconnectWalletButton />}
            {!wallet.publicKey && <ConnectWalletButton />}

            <Box textAlign="center" fontSize="l">
                {wallet.publicKey && <SetTokenOptions />}
            </Box>
        </>
    );
}

export function Tokens2022() {
    const network = "devnet";
    const endpoint = clusterApiUrl(network);
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Tokens2022App />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

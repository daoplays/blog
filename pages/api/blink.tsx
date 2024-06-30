import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Config, PROGRAM, SYSTEM_KEY } from "../../components/state/constants";
import { getRecentPrioritizationFees, get_current_blockhash } from "../../components/state/rpc";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { GetVoteInstruction } from "../../instructions/Vote";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

export default async function handler(req, res) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);

    // Handle OPTIONS method
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        res.status(200).end();
        return;
    }

    if (req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        try {
            const { mint } = req.query;

            let token_mint = new PublicKey(mint);
            let listing_account = PublicKey.findProgramAddressSync([token_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
            const snapshot = await get(ref(database, "data/" + listing_account.toString()));
            let listing = JSON.parse(snapshot.val());
            let text1 = listing.name.replaceAll(" ", "%20");
            console.log(text1.trim());

            let actions = [
                {
                    label: "Hyped", // button text
                    href: "/api/vote?mint=" + mint + "&choice=1",
                },
                {
                    label: "Not Hyped", // button text
                    href: "/api/vote?mint=" + mint + "&choice=2",
                },
            ];

            let title = listing.name + " Hype!";
            let image_link = listing.icon;

            // Your data here
            const data = {
                title: title,
                icon: image_link,
                description: "Vote on your favourite memes at letscook.wtf!",
                label: "Hype Vote",
                links: {
                    actions: actions,
                },
            };
            res.status(200).json(data);
        } catch (error) {
            res.status(400).json({ error: "Invalid mint" });
        }
    } else if (req.method === "POST") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        console.log("in post");
        try {
            const { account } = req.body;

            if (!account) {
                console.log("No account found");
                return res.status(400).json({ error: "Account parameter is required" });
            }
            console.log("have account", account);
            const { game, vote } = req.query;

            let game_val = parseInt(game);
            let vote_val = parseInt(vote);
            if (vote_val < 1 || vote_val > 2) {
                console.log("invalid vote");
                return res.status(400).json({ error: "Invalid vote" });
            }

            let user = new PublicKey(account);
            let instructions = await GetVoteInstruction(user, user, game_val, vote_val);
            let txArgs = await get_current_blockhash("");

            let message = new TransactionMessage({ payerKey: user, recentBlockhash: txArgs.blockhash, instructions });
            let compiled = message.compileToV0Message();
            let transaction = new VersionedTransaction(compiled);
            let encoded_transaction = Buffer.from(transaction.serialize()).toString("base64");

            // Process the decoded account (this is a placeholder, replace with your actual logic)
            const processedData = {
                transaction: encoded_transaction,
                message:
                    "Vote will be stored on chain.  User account wil be created if it does not exist.  For more info visit blinkbash.daoplays.org!",
            };

            res.status(200).json(processedData);
        } catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        // Handle any other HTTP method
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

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
            const { creator, game } = req.query;

            // todo - if params arnt passed get a random one, for now return error image
            if (game === undefined || creator === undefined) {
                const data = {
                    title: "BlinkBash!",
                    icon: "https://blinkbash.daoplays.org/api/errorImage",
                    description: "No entry found",
                    label: "Error",
                    links: {
                        actions: [],
                    },
                };
                res.status(200).json(data);
            }
             


            let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
            let location = "BlinkBash/entries/" + game + "/" + current_date.toString() + "/" + creator;

            const snapshot = await get(ref(database, location));
            let entry = JSON.parse(snapshot.val());

            if (entry === null) {
                // Your data here
                const data = {
                    title: "BlinkBash!",
                    icon: "https://blinkbash.daoplays.org/api/errorImage",
                    description: "No entry found",
                    label: "Error",
                    links: {
                        actions: [],
                    },
                };
                res.status(200).json(data);
            }
            let text = entry.entry;

            let actions = [
                {
                    label: "Up", // button text
                    href: "/api/blink?creator=" + creator + "&game=0&vote=1",
                },
                {
                    label: "Down", // button text
                    href: "/api/blink?creator=" + creator + "&game=0&vote=2",
                },
            ];

            let title = "BlinkBash Vote!";
            let image_link = "https://github.com/daoplays/blog/blob/blinkbash/public/images/prompt.png?raw=true";

            // Your data here
            const data = {
                title: title,
                icon: image_link,
                description: text,
                label: "Vote",
                links: {
                    actions: actions,
                },
            };
            res.status(200).json(data);
        } catch (error) {
            res.status(400).json({ error: "Invalid entry" });
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
            const { creator, game, vote } = req.query;

            let game_val = parseInt(game);
            let vote_val = parseInt(vote);
            if (vote_val < 1 || vote_val > 2) {
                console.log("invalid vote");
                return res.status(400).json({ error: "Invalid vote" });
            }

            let user = new PublicKey(account);
            let creator_key = new PublicKey(creator);

            let instructions = await GetVoteInstruction(user, creator_key, game_val, vote_val);
            let txArgs = await get_current_blockhash("");

            let message = new TransactionMessage({ payerKey: user, recentBlockhash: txArgs.blockhash, instructions });
            let compiled = message.compileToV0Message();
            let transaction = new VersionedTransaction(compiled);
            let encoded_transaction = Buffer.from(transaction.serialize()).toString("base64");

            // Process the decoded account (this is a placeholder, replace with your actual logic)
            const processedData = {
                transaction: encoded_transaction,
                message:
                    "Vote will be stored on chain.  User account will be created if it does not exist.  For more info visit blinkbash.daoplays.org!",
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

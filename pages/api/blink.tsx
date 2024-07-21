import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Config, PROGRAM, SYSTEM_KEY } from "../../components/state/constants";
import { getRecentPrioritizationFees, get_current_blockhash } from "../../components/state/rpc";
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { GetVoteInstruction } from "../../instructions/Vote";
import { GetEnterInstruction } from "../../instructions/Enter";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

const getEntryData = (date: string, ref: string) => {
    let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
    let valid_date = date === current_date.toString();
    let valid_description =
        "Enter a caption for todays BlinkBash prompt!  The caption with the most votes wins!  For more info visit blinkbash.daoplays.org!";
    let invalid_description =
        "This round has now closed!.  Check out blinkbash.daoplays.org for todays game. Submit responses to the days image and vote on entries to earn $BASH!  Users provide text responses to the days image prompt and the community votes on the best entry.  The creator with the most votes wins! This image was by @Dave_Kayac.";
    let description = valid_date ? valid_description : invalid_description;

    let valid_href = "/api/blink?method=enter&game=0&caption={caption}";
    if (ref !== undefined) {
        valid_href = "/api/blink?method=enter&game=0&ref=" + ref + "&caption={caption}";
    }
    console.log("getting entry data", valid_href);
    let actions = valid_date
        ? [
              {
                  href: valid_href,
                  label: "Enter",
                  parameters: [
                      {
                          name: "caption",
                          label: "Enter a caption for the image prompt!",
                      },
                  ],
              },
          ]
        : [];

    let data = {
        title: "BlinkBash!",
        icon: "https://blinkbash.daoplays.org/api/enterImage?game=0&date=" + date,
        description: description,
        label: "Enter",
        links: {
            actions: actions,
        },
    };

    return data;
};

const getEntryPost = async (game: string, caption: string, creator: string, ref: string) => {
    let truncated_caption = caption.slice(0, 250);
    // first post to the DB
    let body = JSON.stringify({
        user_key: creator,
        game: game,
        entry: truncated_caption,
    });

    const response: Response = await fetch("https://blinkbash.daoplays.org/.netlify/functions/postDB?table=entry", {
        method: "POST",
        body: body,
        headers: {
            "Content-Type": "application/json",
        },
    });

    let status = response.status;

    if (status !== 200) {
        return "Error";
    }

    /*   // then share the entry
    const tweet_response = await fetch("/.netlify/functions/postTweet?user_key="+creator, {
        method: "GET",
        body: body,
        headers: {
            "Content-Type": "application/json",
        },
    });
*/

    let creator_key = new PublicKey(creator);
    let ref_key = PROGRAM;
    if (ref !== undefined) {
        ref_key = new PublicKey(ref);
    }

    let instructions = await GetEnterInstruction(creator_key, 0, ref_key);
    let txArgs = await get_current_blockhash("");

    let message = new TransactionMessage({ payerKey: creator_key, recentBlockhash: txArgs.blockhash, instructions });
    let compiled = message.compileToV0Message();
    let transaction = new VersionedTransaction(compiled);
    let encoded_transaction = Buffer.from(transaction.serialize()).toString("base64");

    return encoded_transaction;
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
            const { creator, game, date, method, ref } = req.query;

            let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
            let db_date = date !== undefined ? date : current_date;
            console.log("get args", creator, game, date, method, ref);
            if (method === "enter") {
                console.log("Have enter");
                let data = getEntryData(db_date, ref);
                res.status(200).json(data);
                return;
            }

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

            let valid_date = db_date === current_date.toString();
            let valid_description =
                "Vote on the this entry to earn $BASH!  Users provide text responses to the days image prompt and the community votes on the best entry.  The creator with the most votes wins!  For more info visit blinkbash.daoplays.org!  ";
            let invalid_description =
                "Voting for this entry has already finished.  Check out blinkbash.daoplays.org for todays entries. Submit responses to the days image and vote on entries to earn $BASH!  Users provide text responses to the days image prompt and the community votes on the best entry.  The creator with the most votes wins!";
            let description = valid_date ? valid_description : invalid_description;

            let location = "BlinkBash/entries/" + game + "/" + db_date.toString() + "/" + creator;
            const snapshot = await get(dbRef(database, location));
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

            let ref_string = "";
            if (ref !== undefined) {
                ref_string = "&ref=" + ref;
            }

            let actions = valid_date
                ? [
                      {
                          label: "Up", // button text
                          href: "/api/blink?creator=" + creator + "&game=0&vote=1" + ref_string,
                      },
                      {
                          label: "Down", // button text
                          href: "/api/blink?creator=" + creator + "&game=0&vote=2" + ref_string,
                      },
                  ]
                : [];

            let title = "BlinkBash Vote!";
            let image_link = "https://blinkbash.daoplays.org/api/voteImage?creator=" + creator + "&game=" + game + "&date=" + db_date;

            // Your data here
            const data = {
                title: title,
                icon: image_link,
                description: description,
                label: "Vote",
                links: {
                    actions: actions,
                },
            };
            res.status(200).json(data);
        } catch (error) {
            console.log(error);
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
            const { creator, game, vote, method, caption, ref } = req.query;
            console.log("have account", account, method);

            if (method == "enter") {
                console.log("post in enter", req.body);
                console.log(game, caption, account, ref);
                let transaction = await getEntryPost(game, caption, account, ref);

                // Process the decoded account (this is a placeholder, replace with your actual logic)
                const processedData = {
                    transaction: transaction,
                    message: "Entry sent!  User account will be created if it does not exist.  For more info visit blinkbash.daoplays.org!",
                };

                res.status(200).json(processedData);
                return;
            }

            let game_val = parseInt(game);
            let vote_val = parseInt(vote);
            if (vote_val < 1 || vote_val > 2) {
                console.log("invalid vote");
                return res.status(400).json({ error: "Invalid vote" });
            }

            let user = new PublicKey(account);
            let creator_key = new PublicKey(creator);
            let ref_key = PROGRAM;
            if (ref !== undefined) {
                ref_key = new PublicKey(ref);
            }

            let instructions = await GetVoteInstruction(user, creator_key, game_val, vote_val, ref_key);
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

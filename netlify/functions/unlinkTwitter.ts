const { TwitterApi } = require("twitter-api-v2");
import { Connection, PublicKey } from "@solana/web3.js";
import admin from "firebase-admin";
import bs58 from "bs58";
import nacl from "tweetnacl";

async function verifySignature(publicKey, signature) {
    const message = "Sign to unlink Twitter account from BlinkBash";

    try {
        const publicKeyObj = new PublicKey(publicKey);
        const signatureUint8 = bs58.decode(signature);
        const messageUint8 = new TextEncoder().encode(message);

        return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyObj.toBytes());
    } catch (error) {
        console.error("Error verifying signature:", error);
        return false;
    }
}

exports.handler = async function (event, context) {
    console.log("method ", event.httpMethod);
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid JSON" }),
        };
    }

    console.log(body);
    const { publicKey, signature } = body;
    console.log(signature);
    if (!publicKey || !signature) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters" }),
        };
    }

    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: "letscooklistings",
                    clientEmail: "firebase-adminsdk-lzgk0@letscooklistings.iam.gserviceaccount.com",
                    privateKey: process.env.FIREBASE_KEY.replace(/\\n/g, "\n"),
                }),
                databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com",
            });
        } catch (error) {
            console.log("Firebase admin initialization error:", error.stack);
        }
    }

    try {
        // Verify the signature
        const isValid = await verifySignature(publicKey, signature);

        if (!isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid signature" }),
            };
        }

        const db = admin.database();
        const auth_database = db.ref("twitter_auth/" + publicKey);

        const snapshot2 = await auth_database.get();
        let twitterData = JSON.parse(snapshot2.val());

        const client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: twitterData.accessToken,
            accessSecret: twitterData.accessSecret,
        });

        await auth_database.remove();

        const twitter_database = db.ref("BlinkBash/twitter/" + publicKey);
        await twitter_database.remove();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Unlinked Account" }),
        };
    } catch (error) {
        console.error("Twitter Unlnk error:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Failed to unlink account" }),
        };
    }
};

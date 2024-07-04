const { TwitterApi } = require("twitter-api-v2");
import admin from "firebase-admin";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from '@solana/web3.js';

async function verifySignature(publicKey, signature) {
    const message = "Sign to share post on X";

    try {
      const publicKeyObj = new PublicKey(publicKey);
      const signatureUint8 = bs58.decode(signature);
      const messageUint8 = new TextEncoder().encode(message);
  
      return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyObj.toBytes());
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
}

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { user_key, signature, tweetContent } = JSON.parse(event.body);

        const isValid = await verifySignature(user_key, signature);

        if (!isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid signature" }),
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

        const db = admin.database();
        const database = db.ref("twitter_auth/" + user_key);

        const snapshot2 = await database.get();
        let twitterData = JSON.parse(snapshot2.val());

        const client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: twitterData.accessToken,
            accessSecret: twitterData.accessSecret,
        });

        
    
        await client.v2.tweet(tweetContent);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Tweet posted successfully" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to post tweet" }),
        };
    }
};

const { TwitterApi } = require("twitter-api-v2");
import { Connection, PublicKey } from '@solana/web3.js';
import admin from "firebase-admin";
import bs58 from "bs58";
import nacl from "tweetnacl";

async function verifySignature(publicKey, signature, message) {
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
  
  export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }


    const { publicKey, signature, message } = req.body;

    if (!publicKey || !signature || !message) {
        return res.status(400).json({ error: 'Missing required parameters' });
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

    try{

        // Verify the signature
        const isValid = await verifySignature(publicKey, signature, message);

        if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
        }

        const db = admin.database();
        const database = db.ref("twitter_auth/" + publicKey);

        const snapshot2 = await database.get();
        let twitterData = JSON.parse(snapshot2.val());

        const client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: twitterData.accessToken,
            accessSecret: twitterData.accessSecret,
        });

        //await client.revokeOAuth2Token(twitterData.accessToken);


    } catch (error) {
        console.error("Twitter Unlnk error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to unlink account" }),
        };
    }
};

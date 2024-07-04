const { TwitterApi } = require("twitter-api-v2");
import admin from "firebase-admin";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from '@solana/web3.js';

async function verifySignature(publicKey, signature) {
    const message = "Sign to link Twitter account to BlinkBash";

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
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
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

    const { user_key, signature } = body;

    if (!user_key || !signature) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required parameters" }),
        };
         
    }


    try {


        // Verify the signature
        const isValid = await verifySignature(user_key, signature);

        if (!isValid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid signature" }),
            };
            
        }

        console.log("in twitterAuth with user", user_key);
        const client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_SECRET,
        });
        
        // Generate authentication URL
        const authLink = await client.generateAuthLink("https://blinkbash.daoplays.org/.netlify/functions/twitterCallback");

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

        let body = JSON.stringify({
            user_key: user_key,
            url: authLink.url,
            oauth_token: authLink.oauth_token,
            oauth_token_secret: authLink.oauth_token_secret,
        });
        const db = admin.database();
        const database = db.ref("twitter_auth/" + authLink.oauth_token);
        await database.set(body);

        return {
            statusCode: 200,
            body: body,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to generate auth link" }),
        };
    }
};

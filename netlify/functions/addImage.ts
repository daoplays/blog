import admin from "firebase-admin";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

async function verifySignature(publicKey, signature) {
    const message = "Sign to upload Image";

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
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { user_key, signature, image_url, date } = JSON.parse(event.body);

    if (user_key !== "FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD" && user_key !== "7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5" ) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid user" }),
        };
    }

    const isValid = await verifySignature(user_key, signature);

    if (!isValid) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid signature" }),
        };
    }

    try {
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

        let event_body = JSON.parse(event.body);
        console.log(event_body);
        let body: any;
        let location: string;
        
        location = "BlinkBash/prompts/0/" + date;
        body = JSON.stringify({
            url: image_url,
        });
        

        const db = admin.database();
        const database = db.ref(location);

        // check if the entry exists
        const current = await database.get();
        if (current.val() !== null) {
            return {
                statusCode: 200,
                body: current.val(),
            };
        }

        await database.set(body);

        return {
            statusCode: 200,
            body: body,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to upload image" }),
        };
    }
};

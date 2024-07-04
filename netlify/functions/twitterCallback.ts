const { TwitterApi } = require("twitter-api-v2");
import { getDatabase, ref, get } from "firebase/database";
import { initializeApp } from "firebase/app";
import admin from "firebase-admin";

exports.handler = async function (event, context) {
    const { oauth_token, oauth_verifier } = event.queryStringParameters;

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
    const oauth_db = db.ref("twitter_auth/" + oauth_token);
    const oauth_data = await oauth_db.get();
    let twitterData = JSON.parse(oauth_data.val());

    if (!oauth_token || !oauth_verifier) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing required OAuth parameters" }),
        };
    }

    try {
        // Create a client with the OAuth tokens from the request
        const client = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: oauth_token,
            accessSecret: twitterData.oauth_token_secret,
        });

        // Exchange the request token for an access token
        const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier);

        const client2 = new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });

        // Fetch the user's information
        const user = await client2.v2.me({
            "user.fields": ["name", "username", "profile_image_url"],
        });

        let username = user.data.username;
        let name = user.data.name;
        let profile_image_url = user.data.profile_image_url;

        let body = JSON.stringify({ name, username, profile_image_url });
        const database2 = db.ref("BlinkBash/twitter/" + twitterData.user_key);
        await database2.set(body);

        let auth_body = JSON.stringify({ accessToken, accessSecret });
        const authDB = db.ref("twitter_auth/" + twitterData.user_key);
        await authDB.set(auth_body);

        await oauth_db.remove();
        // Here you would typically save these tokens securely for future use
        // For this example, we'll just return them
        return {
            statusCode: 302,
            headers: {
                Location: `/?twitter=success`,
            },
            body: "Redirecting...",
        };
    } catch (error) {
        console.error("Twitter callback error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to complete OAuth flow" }),
        };
    }
};

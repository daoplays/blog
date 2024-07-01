const { TwitterApi } = require("twitter-api-v2");
import admin from "firebase-admin";

exports.handler = async function (event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { user_key } = event.queryStringParameters;

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

    const { tweetContent } = JSON.parse(event.body);

    try {
        const tweet = await client.v2.tweet(tweetContent);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Tweet posted successfully", tweet }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to post tweet" }),
        };
    }
};

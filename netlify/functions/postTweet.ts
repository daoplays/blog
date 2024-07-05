const { TwitterApi } = require("twitter-api-v2");
import admin from "firebase-admin";

exports.handler = async function (event, context) {
    if (event.httpMethod !== "GET") {
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
    const auth_db = db.ref("twitter_auth/" + user_key);

    const snapshot2 = await auth_db.get();
    let twitterData = JSON.parse(snapshot2.val());

    const client = new TwitterApi({
        appKey: process.env.TWITTER_CONSUMER_KEY,
        appSecret: process.env.TWITTER_CONSUMER_SECRET,
        accessToken: twitterData.accessToken,
        accessSecret: twitterData.accessSecret,
    });
    

    let today_date = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    const entry_db = db.ref("BlinkBash/entries/0/" + today_date.toString() + "/" + user_key);
    const entry_data = await entry_db.get();
    let entry = entry_data.val();
    if (entry === null) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "No entry found" }),
        };
    }

    let entry_json = JSON.parse(entry.toString());
    if (entry_json.tweeted) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Entry already tweeted" }),
        };
    }

    

    let link = "https://blinkbash.daoplays.org/api/blink?creator=" + user_key + "&game=0&date=" + today_date;
    let dial_link = "https://dial.to/?action=solana-action:" + encodeURIComponent(link);

    let tweet_content = "Check out my entry to BlinkBash! " + dial_link;
    console.log(tweet_content)

    try {
        entry_json.tweeted = true;
        await entry_db.set(JSON.stringify(entry_json));

        await client.v2.tweet(tweet_content);
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

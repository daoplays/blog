const { TwitterApi } = require("twitter-api-v2");
import admin from "firebase-admin";

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { user_key } = event.queryStringParameters;

  const client = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  try {
    // Generate authentication URL
    const authLink = await client.generateAuthLink('http://localhost:8888/.netlify/functions/twitterCallback');
    
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: "letscooklistings",
            clientEmail:
              "firebase-adminsdk-lzgk0@letscooklistings.iam.gserviceaccount.com",
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
    const database = db.ref("BlinkBash/twitter_" + authLink.oauth_token);
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

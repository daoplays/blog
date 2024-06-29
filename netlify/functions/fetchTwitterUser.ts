const { TwitterApi } = require('twitter-api-v2');
import admin from 'firebase-admin';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "letscooklistings",
                clientEmail: "firebase-adminsdk-lzgk0@letscooklistings.iam.gserviceaccount.com",
                privateKey:process.env.FIREBASE_KEY.replace(/\\n/g, '\n'),
            }),
            databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com",
            });
    } catch (error) {
        console.log('Firebase admin initialization error:', error.stack);
    }
    }

    const db = admin.database();
    const database = db.ref("BlinkBash/twitter")

    const snapshot2 = await database.get();
    let twitterData = JSON.parse(snapshot2.val());
    

  const client = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: twitterData.accessToken,
    accessSecret: twitterData.accessSecret,
  });

  try {
    // Fetch the user's information
    const user = await client.v2.me({
      'user.fields': ['name', 'username', 'profile_image_url']
    });

    return {
      statusCode: 200,
      body: JSON.stringify(user.data)
    };
  } catch (error) {
    console.error('Error fetching user information:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch user information' })
    };
  }
};
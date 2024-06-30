import admin from "firebase-admin";

exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { table, user_key, game, entry } = event.queryStringParameters;

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

        let body: any;
        let location: string;
        if (table === "entry") {
            let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
            location = "BlinkBash/entries/" + game + "/" + current_date.toString() + "/" + user_key;
            body = JSON.stringify({
                user_key: user_key,
                game: game,
                date: current_date,
                entry: entry,
                score: 0,
                tweeted: false,
            });
        } else if (table === "user") {
            location = "BlinkBash/users/" + user_key;
            body = JSON.stringify({
                user_id: 0,
            });
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid table" }),
            };
        }
        const db = admin.database();
        const database = db.ref(location);
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

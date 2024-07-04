/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../blog/apps/commonHooks/useWallet";
import { Button } from "@chakra-ui/react";
import { TwitterUser } from "../state/interfaces";
import useAppRoot from "../context/useAppRoot";

const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

const TwitterIntegration = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { twitter, setTwitter } = useAppRoot();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const check_twitter_user = useRef<boolean>(true);

    const fetchUserInfo = useCallback(async () => {
        try {
            const response = await fetch("/.netlify/functions/fetchTwitterUser?user_key=" + wallet.publicKey.toString(), {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error("Failed to fetch user information");
            }

            const userData = await response.json();
            console.log("have user data", userData);
            let twitter_user: TwitterUser = {
                name: userData.name,
                username: userData.username,
                profile_image_url: userData.profile_image_url,
            };
            setTwitter(twitter_user);
            setIsAuthenticated(true);
        } catch (error) {
            console.log("Error fetching user info:", error);
        }
    }, [wallet, setTwitter]);

    const unlinkTwitter = useCallback(async () => {
        try {

            const message = `Unlink Twitter account ${Date.now()}`;
            const encodedMessage = new TextEncoder().encode(message);

            // 2. Sign the message
            const signature = await wallet.signMessage(encodedMessage);


            let body = JSON.stringify({
                publicKey: wallet.publicKey.toString(),
                signature: signature,
                message: message,
            });
            const response: Response = await fetch("/.netlify/functions/postDB?table=entry", {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log(response)
            //setTwitter(null);
            //setIsAuthenticated(false);
        } catch (error) {
            console.log("Error fetching user info:", error);
        }
    }, [wallet, setTwitter]);

    const checkTwitterUser = useCallback(async () => {
        if (check_twitter_user.current) {
            try {
                // Initialize Firebase
                const app = initializeApp(firebaseConfig);

                // Initialize Realtime Database and get a reference to the service
                const database = getDatabase(app);
                const snapshot = await get(ref(database, "BlinkBash/twitter/" + wallet.publicKey.toString()));
                let db_entry = JSON.parse(snapshot.val());
                if (db_entry.username) {
                    let twitter_user: TwitterUser = {
                        name: db_entry.name,
                        username: db_entry.username,
                        profile_image_url: db_entry.profile_image_url,
                    };
                    setTwitter(twitter_user);
                    setIsAuthenticated(true);
                } else {
                    await fetchUserInfo();
                }
                check_twitter_user.current = false;
            } catch (error) {
                console.log("check user failed", error);
            }
        }
    }, [wallet, fetchUserInfo, setTwitter]);

    useEffect(() => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }
        checkTwitterUser();
    }, [wallet, isAuthenticated, checkTwitterUser]);

    useEffect(() => {
        if (wallet !== null && wallet.disconnecting) {
            setIsAuthenticated(false);
        }
    }, [wallet])

    const initiateTwitterLogin = async () => {
        try {
            const response = await fetch("/.netlify/functions/twitterAuth?user_key=" + wallet.publicKey.toString(), { method: "GET" });
            const data = await response.json();

            window.location.href = data.url;
        } catch (error) {
            console.log("Error initiating Twitter login:", error);
        }
    };

    return (
        <div style={{ width: "100%" }}>
            {!wallet.connected ? (
                <Button
                    shadow="md"
                    _active={{ bg: "#FFE376" }}
                    _hover={{ opacity: "90%" }}
                    bg="#FFE376"
                    color="#BA6502"
                    rounded="lg"
                    w="full"
                    onClick={() => handleConnectWallet()}
                >
                    Connect Wallet
                </Button>
            ) : (
                !isAuthenticated && (
                    <Button
                        shadow="md"
                        _active={{ bg: "#FFE376" }}
                        _hover={{ opacity: "90%" }}
                        bg="#FFE376"
                        color="#BA6502"
                        rounded="lg"
                        w="full"
                        onClick={initiateTwitterLogin}
                    >
                        Login with Twitter
                    </Button>
                )
            )}
        </div>
    );
};

export default TwitterIntegration;

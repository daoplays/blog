import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { useWallet } from '@solana/wallet-adapter-react';
import UseWalletConnection from '../blog/apps/commonHooks/useWallet';

const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

interface TwitterUser {
  name: string;
  username: string;
  profile_image_url: string;
}


const TwitterIntegration = () => {
  const wallet = useWallet();
  const { handleConnectWallet } = UseWalletConnection();

  const [user, setUser] = useState<TwitterUser>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [tweetContent, setTweetContent] = useState('');
  const check_twitter_user = useRef<boolean>(true);

  const checkTwitterUser = useCallback(async () => {

      if (check_twitter_user.current) {
        try {
           // Initialize Firebase
          const app = initializeApp(firebaseConfig);

          // Initialize Realtime Database and get a reference to the service
          const database = getDatabase(app);
          const snapshot = await get(ref(database, "BlinkBash/twitter_"+wallet.publicKey.toString()));
          let db_entry = JSON.parse(snapshot.val());
          console.log("db_entry", db_entry)
          if (db_entry.username) {
            let twitter_user : TwitterUser = {
              name: db_entry.name,
              username: db_entry.username,
              profile_image_url: db_entry.profile_image_url
            }
            setUser(twitter_user)
            setIsAuthenticated(true);
          }
          else {
            await fetchUserInfo();
          }
          check_twitter_user.current = false;
        } catch (error) {
          console.log("check user failed", error)
        }
      
    }
  }, [wallet]);


  const handleTwitterRedirect = useCallback(async () => {

    const urlParams = new URLSearchParams(window.location.search);

    const twitterResult = urlParams.get('twitter');
    if (twitterResult === "success") {
     
      console.log('Twitter authentication successful');
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/");
    } else if (error) {
      console.error('Twitter authentication failed:', error);
      setError(error);
    }

  }, []);

  useEffect(() => {
    handleTwitterRedirect();
  }, []);

  useEffect(() => {
      if (wallet === null || wallet.publicKey === null) {
        return
      }
      checkTwitterUser();
  }, [wallet, isAuthenticated]);


  const fetchUserInfo = async () => {
   
    try {
      const response = await fetch('/.netlify/functions/fetchTwitterUser?user_key='+wallet.publicKey.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData = await response.json();
      console.log("have user data", userData)
      let twitter_user : TwitterUser = {
        name: userData.name,
        username: userData.username,
        profile_image_url: userData.profile_image_url
      }
      setUser(twitter_user)
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Failed to fetch user information');
    }
  };

  const initiateTwitterLogin = async () => {
    try {
      const response = await fetch('/.netlify/functions/twitterAuth?user_key='+wallet.publicKey.toString(), { method: 'GET' });
      const data = await response.json();
      
      window.location.href = data.url;
    } catch (error) {
      console.error('Error initiating Twitter login:', error);
      setError('Failed to initiate Twitter login');
    }
  };

  const handleTweetSubmit = async (e) => {
    e.preventDefault();
    

    try {
      const response = await fetch('/.netlify/functions/postTweet?user_key='+wallet.publicKey.toString(), {
        method: 'POST',
        body: JSON.stringify({tweetContent })
      });
      const data = await response.json();
      console.log('Tweet posted:', data);
      setTweetContent('');
    } catch (error) {
      console.error('Error posting tweet:', error);
      setError('Failed to post tweet');
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
       {!wallet.connected ? 
        <button onClick={() => handleConnectWallet()}>Connect Wallet</button>
       :
      !isAuthenticated ? (
        <button onClick={initiateTwitterLogin}>Login with Twitter</button>
      ) : (
        <>
          {user && (
            <div>
              <img src={user.profile_image_url} alt="User Avatar" style={{width: 50, height: 50, borderRadius: '50%'}} />
              <h2>{user.name}</h2>
              <p>@{user.username}</p>
            </div>
          )}
          <form onSubmit={handleTweetSubmit}>
            <textarea 
              value={tweetContent} 
              onChange={(e) => setTweetContent(e.target.value)} 
              placeholder="What's happening?"
            />
            <button type="submit">Tweet</button>
          </form>
        </>
      )}
    </div>
  );
};

export default TwitterIntegration;
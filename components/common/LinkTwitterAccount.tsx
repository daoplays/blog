import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};


const TwitterIntegration = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [tweetContent, setTweetContent] = useState('');

  const checkAuthStatus = useCallback(async () => {
    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);
    const snapshot = await get(ref(database, "BlinkBash/twitter"));
    let twitter_credentials = JSON.parse(snapshot.val());
    console.log("twitter creds:", twitter_credentials)
   
    if (twitter_credentials) {
      try {
        //await verifyTwitterCredentials(accessToken, accessSecret);
        setIsAuthenticated(true);
        fetchUserInfo();
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  }, []);


  const handleTwitterRedirect = useCallback(async () => {

    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);
    const snapshot = await get(ref(database, "BlinkBash/twitter"));
    let twitter_credentials = JSON.parse(snapshot.val());
    console.log("twitter creds:", twitter_credentials)
   
    const urlParams = new URLSearchParams(window.location.search);

    const twitterResult = urlParams.get('twitter');
    const accessSecret = urlParams.get('accessSecret');
    const error = urlParams.get('error');
    console.log(twitterResult, accessSecret, error)

    if (twitterResult === "success") {
     
      console.log('Twitter authentication successful');
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, "/");
    } else if (error) {
      console.error('Twitter authentication failed:', error);
      setError(error);
    }

  }, []);

  
  const initializeAuth = useCallback(async () => {
    await handleTwitterRedirect();
    await checkAuthStatus();
  }, [handleTwitterRedirect, checkAuthStatus]);

  useEffect(() => {
    
    initializeAuth();
  }, [initializeAuth]);



  const verifyTwitterCredentials = async (accessToken, accessSecret) => {
    const response = await fetch('/.netlify/functions/verifyTwitterCredentials', {
      method: 'POST',
      body: JSON.stringify({ accessToken, accessSecret })
    });
    if (!response.ok) {
      throw new Error('Failed to verify Twitter credentials');
    }
  };

  const fetchUserInfo = async () => {
    const app = initializeApp(firebaseConfig);

    

    try {
      const response = await fetch('/.netlify/functions/fetchTwitterUser', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Failed to fetch user information');
    }
  };

  const initiateTwitterLogin = async () => {
    try {
      const response = await fetch('/.netlify/functions/twitterAuth', { method: 'POST' });
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
      const response = await fetch('/.netlify/functions/postTweet', {
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
      {!isAuthenticated ? (
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const check_twitter_user = useRef<boolean>(true);

  const checkTwitterUser = useCallback(async () => {

    
      if (check_twitter_user.current) {
        try {
          
          await fetchUserInfo();
          check_twitter_user.current = false;
        } catch (error) {
          console.log("check user failed", error)
        }
      
    }
  }, []);


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

      checkTwitterUser();
  }, [isAuthenticated]);


  const fetchUserInfo = async () => {
   
    try {
      const response = await fetch('/.netlify/functions/fetchTwitterUser', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userData = await response.json();
      console.log("have user data", userData)
      setUser(userData);
      setIsAuthenticated(true);
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
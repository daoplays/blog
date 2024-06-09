import React from 'react'
import ReactPlayer from 'react-player'

// Render a YouTube video player
const Demo = () => {
  return (
    <main
      style={{
        background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)",
      }}
    >
      <ReactPlayer url='https://www.youtube.com/watch?v=LXb3EKWsInQ' />

    </main>
  );
};

export default Demo;

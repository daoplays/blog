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
      
      <video controls={true} width="800" height="500" muted={false}>
        <source src="https://github.com/daoplays/blog/raw/main/components/bonkathon/demo.mp4" type="video/mp4"/>
      </video>
    </main>
  );
};

export default Demo;

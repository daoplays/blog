import Head from 'next/head';
import { useState } from 'react';

export default function TestImage() {

    const [status, setStatus] = useState('');

  const handleClick = async (action: string) => {
    try {
      const response = await fetch(`/api/blink?creator=FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD&game=0&vote=`+action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: "FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD" }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(`Action '${action}' successful`);
        console.log(data);
      } else {
        setStatus(`Action '${action}' failed`);
      }
    } catch (error) {
      setStatus(`Action '${action}' failed: ${error.message}`);
    }
  };
  return (
    <div>
      <Head>
        <title>Interactive Image with Clickable Buttons</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@dao_plays" />
        <meta name="twitter:title" content="Interactive Buttons" />
        <meta name="twitter:description" content="Click the buttons below." />
        <meta name="twitter:image" content="blinkbash.daoplays.org/api/simpleImage" />
        <style>{`
          .image-container {
            position: relative;
            width: 400px;
            height: 200px;
          }
          .image-container img {
            width: 100%;
            height: auto;
          }
          .clickable-area {
            position: absolute;
            background-color: rgba(255, 255, 255, 0);
            cursor: pointer;
          }
          .up-button {
            top: 50px;
            left: 0;
            width: 200px;
            height: 100px;
          }
          .down-button {
            top: 50px;
            left: 200px;
            width: 200px;
            height: 100px;
          }
        `}</style>
      </Head>

      <div>
        <h1>Generated Image with Buttons</h1>
        <div className="image-container">
          <img src="/api/simpleImage" alt="Generated Buttons" />
          <button onClick={() => handleClick('1')} className="clickable-area up-button">
          </button>
          <button onClick={() => handleClick('2')} className="clickable-area down-button">
          </button>
        </div>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
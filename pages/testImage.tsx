import Head from 'next/head';

export default function TestImage() {
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

      <div className="image-container">
        <img src="/api/simpleImage" alt="Interactive Buttons" />
        <a href="/api/blink?creator=FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD&game=0&vote=1" className="clickable-area up-button"></a>
        <a href="/api/blink?creator=FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD&game=0&vote=2" className="clickable-area down-button"></a>
      </div>
    </div>
  );
}
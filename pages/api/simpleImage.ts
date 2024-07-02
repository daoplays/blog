import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  const width = 800; // Image width
  const height = 400; // Image height
  const text = 'BlinkBash!';
  const fontPath = path.resolve('./public/fonts/Whocats.ttf');

  // Read the font file
  const fontData = fs.readFileSync(fontPath).toString('base64');

  // Create an SVG overlay with the text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style type="text/css">
          @font-face {
            font-family: 'Whocats';
            src: url('data:font/ttf;base64,${fontData}') format('truetype');
          }
          .title {
            font-family: 'Whocats';
            font-size: 72px;
            fill: black;
            text-anchor: middle;
          }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="white"/>
      <text x="50%" y="50%" dy=".35em" class="title">${text}</text>
    </svg>
  `;

  // Create the image with Sharp
  const image = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  // Set the content type and send the image
  res.setHeader('Content-Type', 'image/png');
  res.send(image);
}

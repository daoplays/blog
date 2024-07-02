import sharp from 'sharp';
import TextToSVG from 'text-to-svg';
import { promisify } from 'util';
import path from 'path';

export const config = {
  api: {
    responseLimit: false,
  },
};

const textToSVG = TextToSVG.loadSync(path.join(process.cwd(), 'public', 'fonts', 'Whocats.ttf'));

const generateTextPath = (text, fontSize, x, y) => {
  const options = {
    x,
    y,
    fontSize,
    anchor: 'center middle',
  };
  return textToSVG.getD(text, options);
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

    res.status(200).end();
    return;
}

  try {
    console.log('Starting image generation with Sharp and text-to-svg');

    const width = 800;
    const height = 600;

    const blinkPath = generateTextPath('Blink', 50, width / 2 - 60, 60);
    const bashPath = generateTextPath('Bash!', 50, width / 2 + 60, 60);
    const noEntryPath = generateTextPath('No Entry Found', 30, width / 2, height / 2);
    const bottomLine1 = generateTextPath('Head to blinkbash.daoplays.org', 20, width / 2, height - 80);
    const bottomLine2 = generateTextPath('to check out the latest', 20, width / 2, height - 50);
    const bottomLine3Blink = generateTextPath('Blink', 20, width / 2 - 50, height - 20);
    const bottomLine3Bash = generateTextPath('Bash', 20, width / 2 + 10, height - 20);
    const bottomLine3Entries = generateTextPath('entries!', 20, width / 2 + 70, height - 20);

    const svgImage = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#5DBBFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0076CC;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <path d="${blinkPath}" fill="white" />
        <path d="${bashPath}" fill="#FFDD56" />
        <path d="${noEntryPath}" fill="white" />
        <path d="${bottomLine1}" fill="white" />
        <path d="${bottomLine2}" fill="white" />
        <path d="${bottomLine3Blink}" fill="white" />
        <path d="${bottomLine3Bash}" fill="#FFDD56" />
        <path d="${bottomLine3Entries}" fill="white" />
      </svg>
    `;

    const finalImage = await sharp(Buffer.from(svgImage))
      .png()
      .toBuffer();

    console.log('Final image generated, size:', finalImage.length);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");
    res.send(finalImage);

    console.log('Response sent');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error generating image', details: error.message, stack: error.stack });
  }
}
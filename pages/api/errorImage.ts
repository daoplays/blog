import sharp from 'sharp';
import { createCanvas } from 'canvas';

export const config = {
  api: {
    responseLimit: false,
  },
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
    console.log('Starting image generation with text');

    const width = 800;
    const height = 600;

    // Create gradient background
    const gradientSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#5DBBFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0076CC;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>
    `;

    // Create canvas for text
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Add text to canvas
    ctx.font = '50px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('BlinkBash!', width / 2, 60);

    ctx.font = '30px Arial';
    ctx.fillText('No Entry Found', width / 2, height / 2);

    // Convert canvas to buffer
    const textBuffer = canvas.toBuffer('image/png');

    // Combine gradient and text using Sharp
    const finalImage = await sharp(Buffer.from(gradientSvg))
      .composite([{ input: textBuffer, blend: 'over' }])
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
    res.status(500).json({ error: 'Error generating image', details: error.message });
  }
}
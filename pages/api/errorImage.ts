import sharp from 'sharp';

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
    console.log('Starting image generation with Sharp only');

    const width = 800;
    const height = 600;

    // Create SVG with gradient background and text
    const svgImage = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#5DBBFF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0076CC;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="60" font-family="Arial" font-size="50" fill="white" text-anchor="middle">BlinkBash!</text>
        <text x="50%" y="50%" font-family="Arial" font-size="30" fill="white" text-anchor="middle">No Entry Found</text>
      </svg>
    `;

    // Convert SVG to PNG using Sharp
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
    res.status(500).json({ error: 'Error generating image', details: error.message });
  }
}
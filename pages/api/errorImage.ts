import sharp from 'sharp';
import TextToSVG from 'text-to-svg';
import path from 'path';

export const config = {
  api: {
    responseLimit: false,
  },
};

let textToSVG;

const initializeTextToSVG = async () => {
  if (!textToSVG) {
    textToSVG = TextToSVG.loadSync(path.join(process.cwd(), 'public', 'fonts', 'Whocats.ttf'));
  }
};

const generateTextPath = (text, fontSize, x, y, anchor = 'left middle') => {
  const options = { x, y, fontSize, anchor };
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

  await initializeTextToSVG();

  const width = 500;
  const height = 500;

  try {
    console.log('Starting image generation with dynamic layout and colored text');

    const titleFontSize = 50;
    const middleFontSize = 30;
    const bottomFontSize = 20;

    const padding = Math.round(width * 0.025);
    const verticalSpacing = height * 0.05;

    // Generate paths for all text elements
    const titleWidth = textToSVG.getMetrics('BlinkBash!', { fontSize: titleFontSize }).width;
    const titleWidth2 = textToSVG.getMetrics('Blink', { fontSize: titleFontSize }).width;

    const blinkPath = generateTextPath('Blink', titleFontSize, width / 2 - titleWidth/2, padding + titleFontSize / 2);
    const bashPath = generateTextPath('Bash!', titleFontSize, width / 2 - titleWidth/2 + titleWidth2, padding + titleFontSize / 2);

    const entryWidth = textToSVG.getMetrics('No Entry Found', { fontSize: middleFontSize }).width;
    const noEntryPath = generateTextPath('No Entry Found', middleFontSize, width / 2 - entryWidth/2, height / 2);

    const bottomY1 = height - 3 * verticalSpacing - bottomFontSize;
    const bottomY2 = height - 2 * verticalSpacing - bottomFontSize;
    const bottomY3 = height - verticalSpacing - bottomFontSize;

    const bl1Text = 'Head to blinkbash.daoplays.org'
    const bl2Text = 'to check out the latest';
    const bl1Width = textToSVG.getMetrics(bl1Text, { fontSize: bottomFontSize }).width;
    const bl2Width = textToSVG.getMetrics(bl2Text, { fontSize: bottomFontSize }).width;

    const bottomLine1 = generateTextPath(bl1Text, bottomFontSize, width / 2 - bl1Width  / 2, bottomY1);
    const bottomLine2 = generateTextPath(bl2Text, bottomFontSize, width / 2 - bl2Width / 2, bottomY2);
    
    const bottomBlinkWidth = textToSVG.getMetrics('Blink', { fontSize: bottomFontSize }).width;
    const bottomBashWidth = textToSVG.getMetrics('Bash', { fontSize: bottomFontSize }).width;
    const entriesWidth = textToSVG.getMetrics(' entries!', { fontSize: bottomFontSize }).width;
    const totalWidth = bottomBlinkWidth + bottomBashWidth + entriesWidth;
    
    const bottomBlinkPath = generateTextPath('Blink', bottomFontSize, width / 2 - totalWidth / 2, bottomY3);
    const bottomBashPath = generateTextPath('Bash', bottomFontSize, width / 2 - totalWidth / 2 + bottomBlinkWidth, bottomY3);
    const bottomEntriesPath = generateTextPath(' entries!', bottomFontSize, width / 2 - totalWidth / 2 + bottomBlinkWidth + bottomBashWidth, bottomY3);

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
        <path d="${bottomBlinkPath}" fill="white" />
        <path d="${bottomBashPath}" fill="#FFDD56" />
        <path d="${bottomEntriesPath}" fill="white" />
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

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Error generating image', details: error.message });
  }
}
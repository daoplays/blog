import { createCanvas, registerFont } from 'canvas';
import sharp from 'sharp';
import path from 'path';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const width = 400;
  const height = 400;
  const padding = 20;
  const titleFontSize = 50;
  const middleFontSize = 30;
  const bottomFontSize = 20;

  try {
    // Register the custom font
    registerFont(path.join(process.cwd(), 'public', 'fonts', 'Whocats.ttf'), { family: 'CustomFont' });

    // Create a canvas for the text
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Function to draw centered text
    const drawCenteredText = (text, y, fontSize, color) => {
      ctx.font = `${fontSize}px "CustomFont"`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, y);
    };

    // Draw title "BlinkBash!"
    ctx.font = `${titleFontSize}px "CustomFont"`;
    ctx.textBaseline = 'top';
    const blinkWidth = ctx.measureText('Blink').width;
    const bashWidth = ctx.measureText('Bash!').width;
    const totalWidth = blinkWidth + bashWidth;
    const space = 10;
    const startX = (width - totalWidth - space) / 2;

    ctx.fillStyle = 'white';
    ctx.fillText('Blink', startX, padding);
    ctx.fillStyle = '#FFDD56';
    ctx.fillText('Bash!', startX + blinkWidth + space, padding);

    // Draw "No Entry Found" in the middle
    drawCenteredText('No Entry Found', height / 2, middleFontSize, 'white');

    // Draw bottom text in three lines
    const lineHeight = bottomFontSize * 1.5;
    const bottomTextY = height - padding - lineHeight * 2;

    drawCenteredText('Head to blinkbash.daoplays.org', bottomTextY, bottomFontSize, 'white');
    drawCenteredText('to check out the latest', bottomTextY + lineHeight, bottomFontSize, 'white');

    // Draw the last line with split-colored "BlinkBash" and proper spacing
    ctx.font = `${bottomFontSize}px "CustomFont"`;
    const lastLineY = bottomTextY + lineHeight * 2;
    const lastLineText = 'BlinkBash entries!';
    const blinkWidth2 = ctx.measureText('Blink').width;
    const bashWidth2 = ctx.measureText('Bash').width;
    const spaceWidth = ctx.measureText(' ').width;
    const entriesWidth = ctx.measureText('entries!').width;
    const fullLineWidth = blinkWidth2 + bashWidth2  + entriesWidth*0.5;
    const startOfLine = width / 2 - fullLineWidth / 2;

    ctx.fillStyle = 'white';
    ctx.fillText('Blink', startOfLine, lastLineY);
    ctx.fillStyle = '#FFDD56';
    ctx.fillText('Bash', startOfLine + blinkWidth2, lastLineY);
    ctx.fillStyle = 'white';
    ctx.fillText(' entries!', startOfLine + blinkWidth2 + bashWidth2+spaceWidth*3, lastLineY);

    // Convert canvas to buffer
    const textBuffer = canvas.toBuffer('image/png');

    // Create gradient background SVG
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

    // Create gradient background with Sharp
    const background = await sharp(Buffer.from(gradientSvg))
      .resize(width, height)
      .png()
      .toBuffer();

    // Composite text onto gradient background
    const finalImage = await sharp(background)
      .composite([{ input: textBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    // Set the content type and send the image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
    res.send(finalImage);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Error generating image' });
  }
}
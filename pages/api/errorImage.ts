import { createCanvas, registerFont } from 'canvas';
import sharp from 'sharp';
import path from 'path';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {

  console.log(req)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

    res.status(200).end();
    return;
}
try{
    res.setHeader('Content-Type', 'image/png');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

    const size = 200; // Size of the square in pixels
    
    const blueSquare = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    console.log('Blue square generated, size:', blueSquare.length);

    res.send(blueSquare);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Error generating image' });
  }
}
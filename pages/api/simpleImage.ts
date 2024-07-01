import sharp from "sharp";

const handler = async (req, res) => {
    console.log("in simple image");
    const buttonUp = `
    <svg width="200" height="100">
      <rect width="200" height="100" style="fill:blue;stroke:black;stroke-width:2"/>
      <text x="100" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Up</text>
    </svg>`;

    const buttonDown = `
    <svg width="200" height="100">
      <rect width="200" height="100" style="fill:red;stroke:black;stroke-width:2"/>
      <text x="100" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Down</text>
    </svg>`;

    try {
        const imageBuffer = await sharp({
            create: {
                width: 400,
                height: 200,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
            .composite([
                { input: Buffer.from(buttonUp), top: 50, left: 0 },
                { input: Buffer.from(buttonDown), top: 50, left: 200 },
            ])
            .png()
            .toBuffer();

        res.setHeader("Content-Type", "image/png");
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate image" });
    }
};

export default handler;

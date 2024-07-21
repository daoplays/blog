import sharp from "sharp";
import TextToSVG from "text-to-svg";
import path from "path";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { wrapLongWords } from "../../components/state/utils";
import fetch from "node-fetch";
import emojiRegex from "emoji-regex";
import * as twemojiParser from "twemoji-parser";

const firebaseConfig = {
    // Your Firebase configuration here
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

export const config = {
    api: {
        responseLimit: false,
    },
};

let whocatsTextToSVG: TextToSVG;
let notoTextToSVG: TextToSVG;

const initializeTextToSVG = async () => {
    if (!whocatsTextToSVG) {
        whocatsTextToSVG = TextToSVG.loadSync(path.join(process.cwd(), "public", "fonts", "Whocats.ttf"));
    }
    if (!notoTextToSVG) {
        notoTextToSVG = TextToSVG.loadSync(path.join(process.cwd(), "public", "fonts", "NotoSansSC-Regular.otf"));
    }
};

const getEmojiSvg = async (emoji: string): Promise<string> => {
    const entities = twemojiParser.parse(emoji);
    if (entities.length === 0) {
        console.error(`No Twemoji found for emoji: ${emoji}`);
        return "";
    }
    const fileName = path.basename(entities[0].url, ".png");
    const url = `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${fileName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch emoji SVG: ${response.statusText}`);
        return await response.text();
    } catch (error) {
        console.error(`Failed to load emoji SVG for ${emoji}:`, error);
        return "";
    }
};

const stripFormatting = (text: string): string => {
    // Remove newline characters and other whitespace
    return text
        .replace(/[\n\r\t\f\v]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const splitTextAndEmojis = (text: string): { type: "text" | "emoji"; content: string }[] => {
    const regex = emojiRegex();
    const parts: { type: "text" | "emoji"; content: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
        }
        parts.push({ type: "emoji", content: match[0] });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    return parts;
};

const splitTextIntoLines = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = calculateLineWidth(testLine, fontSize);

        if (lineWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};
const generateTextElements = async (text: string, fontSize: number, x: number, y: number): Promise<string> => {
    let currentX = x;
    const elements: string[] = [];
    const parts = splitTextAndEmojis(text);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.type === "text") {
            const metrics = notoTextToSVG.getMetrics(part.content, { fontSize });
            const path = notoTextToSVG.getD(part.content, { x: currentX, y, fontSize, anchor: "left middle" });
            elements.push(`<path d="${path}" fill="white" />`);
            currentX += metrics.width;
        } else {
            const emojiSvg = await getEmojiSvg(part.content);
            const emojiSize = fontSize * 0.2;
            const emojiY = y - fontSize / 2 + emojiSize / 2;
            elements.push(`<g transform="translate(${currentX}, ${emojiY}) scale(${emojiSize / 64})">${emojiSvg}</g>`);
            currentX += emojiSize;

            // Add spacing after emoji, but only if it's not the last element
            // and the next element is also an emoji
            if (i < parts.length - 1) {
                console.log("add more spacing");
                currentX += emojiSize * 6; // Add 25% of emoji size as spacing
            }
        }
    }

    return elements.join("");
};

const calculateLineWidth = (line: string, fontSize: number): number => {
    const parts = splitTextAndEmojis(line);
    let totalWidth = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.type === "text") {
            totalWidth += notoTextToSVG.getMetrics(part.content, { fontSize }).width;
        } else {
            const emojiSize = fontSize * 0.2;
            totalWidth += emojiSize;

            // Add spacing after emoji if it's not the last element
            // and the next element is also an emoji
            if (i < parts.length - 1) {
                totalWidth += emojiSize * 6;
            }
        }
    }

    return totalWidth;
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

    const width = 400;
    const height = 400;

    try {
        const { game, creator, date } = req.query;

        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        let location = "BlinkBash/entries/" + game + "/" + date.toString() + "/" + creator;

        const snapshot = await get(ref(database, location));
        let entry = JSON.parse(snapshot.val());

        console.log("Starting image generation with dynamic layout and colored text", entry);

        const titleFontSize = 50;
        const bottomFontSize = 14;

        const padding = Math.round(width * 0.005);

        // Generate paths for title elements
        const titleWidth = whocatsTextToSVG.getMetrics("BlinkBash!", { fontSize: titleFontSize }).width;
        const titleWidth2 = whocatsTextToSVG.getMetrics("Blink", { fontSize: titleFontSize }).width;

        const blinkPath = whocatsTextToSVG.getD("Blink", {
            fontSize: titleFontSize,
            x: width / 2 - titleWidth / 2,
            y: padding + titleFontSize / 2,
            anchor: "left middle",
        });
        const bashPath = whocatsTextToSVG.getD("Bash!", {
            fontSize: titleFontSize,
            x: width / 2 - titleWidth / 2 + titleWidth2,
            y: padding + titleFontSize / 2,
            anchor: "left middle",
        });

        // Dynamic bottom text
        const bottomText = stripFormatting(wrapLongWords(entry.entry));

        const truncatedText = bottomText.slice(0, 250);
        const maxLineWidth = width - 2 * padding;
        const lines = splitTextIntoLines(truncatedText, maxLineWidth, bottomFontSize);

        const lineHeight = bottomFontSize * 1.5;
        let startY = height - lineHeight;

        // If there's more than one line, move the start position up
        if (lines.length > 1) {
            startY -= (lines.length - 1) * lineHeight;
        }

        const bottomTextElements = await Promise.all(
            lines.map(async (line, index) => {
                const lineWidth = calculateLineWidth(line, bottomFontSize);
                const x = (width - lineWidth) / 2;
                const y = startY + index * lineHeight;
                return generateTextElements(line, bottomFontSize, x, y);
            }),
        );

        const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + date));
        let prompt_val = prompt_db.val();
        let json = JSON.parse(prompt_val.toString());
        let image_link = json["url"];

        const imageResponse = await fetch(image_link);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        const centerImageSize = 250;
        const resizedImage = await sharp(imageBuffer)
            .resize(centerImageSize, centerImageSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        const svgImage = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#5DBBFF;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0076CC;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)"/>
            <path d="${blinkPath}" fill="white" />
            <path d="${bashPath}" fill="#FFDD56" />
            ${bottomTextElements.join("\n")}
        </svg>
        `;

        const finalImage = await sharp(Buffer.from(svgImage))
            .composite([
                {
                    input: resizedImage,
                    top: Math.round((height - centerImageSize) / 2 - 25),
                    left: Math.round((width - centerImageSize) / 2),
                },
            ])
            .png()
            .toBuffer();

        console.log("Final image generated, size:", finalImage.length);

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");
        res.send(finalImage);
    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: "Error generating image", details: error.message });
    }
}

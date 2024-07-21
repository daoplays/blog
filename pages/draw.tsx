import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    VStack,
    HStack,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import useUploadImage from "../hooks/useUploadImage";

const DrawingCanvas = ({ width = 500, height = 300 }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);
    const [tool, setTool] = useState("brush");
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);

    const { UploadImage } = useUploadImage();
    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.300", "gray.600");
    const frameColor = useColorModeValue("gray.200", "gray.700");

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [bgColor]);

    const drawDot = useCallback(
        (x, y) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = tool === "eraser" ? bgColor : color;
            ctx.fill();
        },
        [tool, color, size, bgColor],
    );

    const startDrawing = useCallback(
        (e) => {
            const { offsetX, offsetY } = getCoordinates(e);
            setIsDrawing(true);
            setLastX(offsetX);
            setLastY(offsetY);
            drawDot(offsetX, offsetY);
        },
        [drawDot],
    );

    const draw = useCallback(
        (e) => {
            if (!isDrawing) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const { offsetX, offsetY } = getCoordinates(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(offsetX, offsetY);

            if (tool === "eraser") {
                ctx.strokeStyle = bgColor;
            } else {
                ctx.strokeStyle = color;
            }
            ctx.lineWidth = size;
            ctx.stroke();

            setLastX(offsetX);
            setLastY(offsetY);
        },
        [isDrawing, lastX, lastY, tool, color, size, bgColor],
    );

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e) => {
        if (e.touches && e.touches[0]) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top,
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY,
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const saveDrawing = () => {
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
            const file = new File([blob], "drawing.png", { type: "image/png" });
            console.log("File object created:", file);
            // You can now use this file object as needed
            UploadImage(file);
        }, "image/png");
    };

    const cursorStyle =
        tool === "eraser"
            ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="white" stroke="black" stroke-width="1"/></svg>') ${size / 2} ${size / 2}, auto`
            : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${encodeURIComponent(color)}"/></svg>') ${size / 2} ${size / 2}, auto`;

    return (
        <VStack spacing={4} align="center" width={`${width}px`}>
            <Box borderWidth={8} borderColor={frameColor} borderRadius="lg" overflow="hidden" boxShadow="md">
                <Box borderWidth={1} borderColor={borderColor}>
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{
                            touchAction: "none",
                            cursor: cursorStyle,
                        }}
                    />
                </Box>
            </Box>
            <VStack spacing={4} align="stretch" width="100%">
                <HStack spacing={2} justify="center">
                    <Button colorScheme={tool === "brush" ? "blue" : "gray"} onClick={() => setTool("brush")}>
                        Brush
                    </Button>
                    <Button colorScheme={tool === "eraser" ? "blue" : "gray"} onClick={() => setTool("eraser")}>
                        Eraser
                    </Button>
                    <Button colorScheme="red" onClick={clearCanvas}>
                        Clear
                    </Button>
                    <Button colorScheme="green" onClick={saveDrawing}>
                        Save
                    </Button>
                </HStack>
                <HStack spacing={4}>
                    <Text minWidth="80px">Color:</Text>
                    <Box borderWidth={1} borderColor={borderColor} borderRadius="md" overflow="hidden">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            style={{ width: "50px", height: "30px", border: "none" }}
                        />
                    </Box>
                </HStack>
                <HStack spacing={4}>
                    <Text minWidth="80px">Size:</Text>
                    <Slider aria-label="size-slider" defaultValue={size} min={1} max={50} onChange={(val) => setSize(val)}>
                        <SliderTrack>
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider>
                    <Text minWidth="30px" textAlign="right">
                        {size}
                    </Text>
                </HStack>
            </VStack>
        </VStack>
    );
};

export default DrawingCanvas;

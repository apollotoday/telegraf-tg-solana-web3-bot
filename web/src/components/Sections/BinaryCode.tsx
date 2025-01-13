"use client";

import React, { useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";

const BinaryCode = () => {
  const [lines, setLines] = useState<string[]>([]);

  function generateBinaryString(length: number): string {
    return Array.from({ length }, () => Math.round(Math.random())).join("");
  }

  useEffect(() => {
    setLines(Array(15).fill(generateBinaryString(200)));

    const interval = setInterval(() => {
      setLines((prevLines) =>
        prevLines.map(
          () => generateBinaryString(200) // Randomly regenerate some lines
        )
      );
    }, 95);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      width={"full"}
      height={{ base: "200px", md: "392px" }}
      // my={{ lg: "40px" }}
      pos={"relative"}
      overflow={"hidden"}
      bg="black"
      color={"#CDCDCD"}
      fontFamily="'PT Mono', 'Courier'"
      fontWeight="400"
      letterSpacing={{ base: "5px", md: "10px" }}
      fontSize={{ base: "15px", md: "20px" }}
      lineHeight="25px"
      margin="auto"
      textAlign="center"
      userSelect={"none"}
      zIndex={20}
      _before={{
        pointerEvents: "none",
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: {
          base: "radial-gradient(ellipse at center, transparent, black 60%)",
          md: "radial-gradient(ellipse at center, transparent, black 45%)",
        },
        zIndex: 1,
      }}
    >
      {lines.map((line) => line)}
    </Box>
  );
};

export default BinaryCode;

import React, { useState } from 'react';
import { Box,  Text, HStack, Button, useClipboard } from '@chakra-ui/react';
import { Highlight, themes } from 'prism-react-renderer';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface CodeBlockProps {
  children: string;
  language: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language }) => {
  const { hasCopied, onCopy } = useClipboard(children);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = () => {
    onCopy();
  };

  return (
    <Box my={4} borderRadius="md" overflow="hidden" position="relative">
      <HStack 
        bg="gray.800" 
        color="gray.300" 
        px={4} 
        py={2} 
        justifyContent="space-between"
      >
        <Text fontSize="sm">{language}</Text>
        <HStack
          as="button"
          onClick={handleCopy}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          color={isHovered ? "white" : "gray.300"}
          transition="color 0.2s"
          _hover={{ cursor: 'pointer' }}
        >
          <FaCopy size={14} />
          <Text m={0} fontSize="sm">{hasCopied ? "Copied!" : "Copy"}</Text>
        </HStack>
      </HStack>
      <Highlight theme={themes.vsDark} code={children.trim()} language={language as any}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={{ 
            ...style, 
            padding: '20px', 
            margin: 0,
            overflow: 'auto'
          }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </Box>
  );
};

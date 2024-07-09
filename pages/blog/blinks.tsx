import React, { useState } from 'react';
import { Box, Heading, Text, OrderedList, ListItem, VStack, HStack, Button, useClipboard } from '@chakra-ui/react';
import { Highlight, themes } from 'prism-react-renderer';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface CodeBlockProps {
  children: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language }) => {
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



const PostContent: React.FC = () => {
        return (
          <Box width="80%" margin="auto">
            <VStack spacing={6} align="stretch">
              <Heading as="h1" size="2xl">Setting Up an API for Blink Interactions with NextJS</Heading>
      
              <Text>
                In this blog post, we'll explore how to set up an API to interact with 'blinks' using React and NextJS. 
                We'll break down a complex API handler that manages various operations related to a game called "BlinkBash". 
                This API handles entry submissions, voting, and retrieval of game data, while also interacting with both a Firebase Realtime Database and the Solana blockchain.
              </Text>
      
              <Heading as="h2" size="xl">File Overview</Heading>
      
              <Text>
                The file we're discussing is an API route handler in a NextJS application. It's a crucial part of our backend that handles various responsibilities:
              </Text>
      
              <OrderedList spacing={2}>
                <ListItem>Handling GET requests to retrieve game data: This allows clients to fetch current game states, player information, and other relevant data.</ListItem>
                <ListItem>Processing POST requests for entering captions and voting: This enables players to submit their entries and cast votes for their favorite captions.</ListItem>
                <ListItem>Interacting with a Firebase Realtime Database: We use Firebase to store and retrieve game data in real-time, ensuring all players have up-to-date information.</ListItem>
                <ListItem>Creating and encoding Solana blockchain transactions: This integration allows us to record game actions on the Solana blockchain, providing transparency and immutability to the game's outcomes.</ListItem>
              </OrderedList>
      
              <Text>Let's dive into the different sections of this file and understand how it all works together.</Text>
      
              <Heading as="h2" size="xl">Imports and Configuration</Heading>
      
              <Text>At the top of the file, we have our necessary imports:</Text>
      
              <CodeBlock language="javascript">
      {`import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
      import { Config, PROGRAM, SYSTEM_KEY } from "../../components/state/constants";
      import { getRecentPrioritizationFees, get_current_blockhash } from "../../components/state/rpc";
      import { initializeApp } from "firebase/app";
      import { getDatabase, ref, get } from "firebase/database";
      import { GetVoteInstruction } from "../../instructions/Vote";
      import { GetEnterInstruction } from "../../instructions/Enter";`}
              </CodeBlock>
      
              <Text>
                These imports bring in necessary functions and classes from various libraries:
                <OrderedList>
                  <ListItem>@solana/web3.js: This provides tools for interacting with the Solana blockchain.</ListItem>
                  <ListItem>Local constants and RPC functions: These are custom modules we've created to manage game state and interact with the Solana network.</ListItem>
                  <ListItem>Firebase: We use these to initialize our app and interact with the Realtime Database.</ListItem>
                  <ListItem>Custom instruction modules: These handle the specifics of voting and entering the game.</ListItem>
                </OrderedList>
              </Text>
      
              <Text>Next, we have a Firebase configuration object:</Text>
      
              <CodeBlock language="javascript">
      {`const firebaseConfig = {
          // ...
          databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
      };`}
              </CodeBlock>
      
              <Text>
                This configuration object is used to initialize our Firebase app and connect to the Realtime Database. 
                The databaseURL is crucial as it points to the specific Firebase project we're using for this game.
              </Text>
      
              <Heading as="h2" size="xl">API Handler Structure</Heading>
      
              <Text>
                The main API handler is an async function that processes both GET and POST requests. 
                Here's the general structure:
              </Text>
      
              <CodeBlock language="javascript">
      {`export default async function handler(req, res) {
        // CORS handling
        if (req.method === 'OPTIONS') {
          // Set CORS headers
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");
          res.status(200).end();
          return;
        }
      
        if (req.method === 'GET') {
          // Handle GET request logic
        } else if (req.method === 'POST') {
          // Handle POST request logic
        } else {
          // Handle other methods
          res.setHeader('Allow', ['GET', 'POST']);
          res.status(405).end(\`Method \${req.method} Not Allowed\`);
        }
      }`}
              </CodeBlock>
      
              <Heading as="h3" size="lg">Understanding CORS</Heading>
      
              <Text>
                CORS stands for Cross-Origin Resource Sharing. It's a security feature implemented by web browsers to restrict web pages from making requests to a different domain than the one serving the web page. This is crucial for preventing certain types of malicious attacks.
              </Text>
      
              <Text>
                In our API handler, we're setting up CORS to allow requests from any origin ('*'). Here's what each header does:
              </Text>
      
              <OrderedList>
                <ListItem>
                  <strong>Access-Control-Allow-Origin: "*"</strong> - This allows any domain to make requests to our API. In a production environment, you might want to restrict this to specific domains.
                </ListItem>
                <ListItem>
                  <strong>Access-Control-Allow-Methods: "GET,POST,PUT,OPTIONS"</strong> - This specifies which HTTP methods are allowed when accessing the resource. We're allowing GET, POST, PUT, and OPTIONS requests.
                </ListItem>
                <ListItem>
                  <strong>Access-Control-Allow-Headers</strong> - This indicates which HTTP headers can be used during the actual request. We're allowing Content-Type, Authorization, Content-Encoding, and Accept-Encoding headers.
                </ListItem>
              </OrderedList>
      
              <Text>
                The OPTIONS method is a preflight request that the browser sends before the actual request to check if the CORS protocol is understood. Our handler responds to this request with the appropriate CORS headers.
              </Text>
      
              <Heading as="h3" size="lg">GET Request Handling</Heading>
      
              <Text>
                For GET requests, the handler retrieves game data. Here's a simplified version of the GET handling:
              </Text>
      
              <CodeBlock language="javascript">
      {`if (req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");
      
        try {
          const { creator, game, date, method } = req.query;
      
          let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
          let db_date = date !== undefined ? date : current_date;
      
          if (method === "enter") {
            let data = getEntryData(db_date);
            res.status(200).json(data);
            return;
          }
      
          // Additional logic for handling other GET scenarios
          // ...
      
        } catch (error) {
          res.status(400).json({ error: "Invalid entry" });
        }
      }`}
              </CodeBlock>
      
              <Text>
                This GET handler does several things:
                <OrderedList>
                  <ListItem>It sets the appropriate headers for the response, including CORS headers.</ListItem>
                  <ListItem>It extracts query parameters from the request (creator, game, date, method).</ListItem>
                  <ListItem>It calculates the current date and determines which date to use for database queries.</ListItem>
                  <ListItem>If the method is "enter", it retrieves entry data for the specified date.</ListItem>
                  <ListItem>It handles potential errors by sending a 400 status code with an error message.</ListItem>
                </OrderedList>
              </Text>
      
              <Heading as="h3" size="lg">POST Request Handling</Heading>
      
              <Text>
                POST requests are used for entering captions and voting. Here's a simplified version of the POST handling:
              </Text>
      
              <CodeBlock language="javascript">
      {`else if (req.method === "POST") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      
        try {
          const { account } = req.body;
      
          if (!account) {
            return res.status(400).json({ error: "Account parameter is required" });
          }
      
          const { creator, game, vote, method, caption } = req.query;
      
          if (method == "enter") {
            let transaction = await getEntryPost(game, caption, account);
      
            const processedData = {
              transaction: transaction,
              message: "Entry sent! User account will be created if it does not exist. For more info visit blinkbash.daoplays.org!",
            };
      
            res.status(200).json(processedData);
            return;
          }
      
          // Additional logic for handling votes
          // ...
      
        } catch (error) {
          console.error("Error processing request:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }`}
              </CodeBlock>
      
              <Text>
                The POST handler performs these tasks:
                <OrderedList>
                  <ListItem>It sets the appropriate headers for the response.</ListItem>
                  <ListItem>It extracts the account information from the request body.</ListItem>
                  <ListItem>It validates that an account was provided.</ListItem>
                  <ListItem>It extracts additional parameters from the query string.</ListItem>
                  <ListItem>If the method is "enter", it processes a new entry, creating a blockchain transaction.</ListItem>
                  <ListItem>It handles potential errors, logging them and sending appropriate error responses.</ListItem>
                </OrderedList>
              </Text>
      
              <Heading as="h2" size="xl">Conclusion</Heading>
      
              <Text>
                This API handler demonstrates how to create a versatile endpoint that interacts with both a Firebase Realtime Database 
                and the Solana blockchain. It showcases how to handle different types of requests, process game-related actions, 
                and create blockchain transactions.
              </Text>
      
              <Text>
                Key takeaways from this implementation include:
                <OrderedList>
                  <ListItem>Proper CORS handling for secure cross-origin requests</ListItem>
                  <ListItem>Differentiated handling of GET and POST requests</ListItem>
                  <ListItem>Integration with Firebase for real-time data storage and retrieval</ListItem>
                  <ListItem>Creation of Solana blockchain transactions for game actions</ListItem>
                  <ListItem>Error handling and appropriate status code responses</ListItem>
                </OrderedList>
              </Text>
      
              <Text>
                By using NextJS, we can easily create API routes that can be deployed alongside our React application, 
                providing a seamless integration between the frontend and backend. This approach allows for a robust, 
                scalable architecture that can handle complex game logic while maintaining responsiveness and data integrity.
              </Text>
      
              <Text>
                Remember to secure your API, handle edge cases, and thoroughly test your endpoints before deploying to production. 
                Happy coding!
              </Text>
            </VStack>
          </Box>
  );
};

export default PostContent;
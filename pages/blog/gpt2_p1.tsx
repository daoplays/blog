import React, { useState } from 'react';
import { Center, Image, UnorderedList, Box, VStack, Heading, Text, OrderedList, ListItem, Code, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue, Flex } from '@chakra-ui/react';
import { Highlight, themes } from 'prism-react-renderer';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { CodeBlock } from '../../components/common/code_highlight';


const TokenizationProcess = () => {
    return (
        <Box width="100%" margin="auto">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="2xl">GPT-2 Tokenization Process</Heading>
    
            <Text>
              Before we get onto any code it is probably useful to go through a concrete example of exactly what the tokenisation process it doing.  So, let's break down the GPT-2 tokenization process using the example sentence: 
              <Code>"GPT2 was created by OpenAI"</Code>
            </Text>
    
            <Heading as="h2" size="xl">Step 1: Initial Splitting</Heading>
            <Text>
              The first thing that happens is that the tokenizer uses an thoroughly horrific regex (regular expression) to split the input into more manageable smaller chunks  while preserving important linguistic features:
            </Text>
            <Code display="block" whiteSpace="pre" p={2} bg="gray.100" borderRadius="md">
          {`std::regex("'s|'t|'re|'ve|'m|'ll|'d| ?[a-zA-Z]+| ?[0-9]+| ?[^\\s\\w]+|\\s+(?!\\S)|\\s+");`}
            </Code>
           
            
            <UnorderedList spacing={2}>
                <ListItem>The pattern uses the '|' (pipe) symbol to separate different matching rules, attempted in order from left to right.</ListItem>
                <ListItem>Order of splitting:
                <OrderedList>
                    <ListItem>Common English contractions ('s, 't, 're, 've, 'm, 'll, 'd)</ListItem>
                    <ListItem>Words (sequences of letters), optionally preceded by a space</ListItem>
                    <ListItem>Numbers, optionally preceded by a space</ListItem>
                    <ListItem>Non-space and non-word characters (like punctuation), optionally preceded by a space</ListItem>
                    <ListItem>Various types of whitespace</ListItem>
                </OrderedList>
                </ListItem>
                <ListItem>The pattern is greedy, matching the longest possible string for each rule before moving to the next.</ListItem>
                <ListItem>Optional spaces before words, numbers, and punctuation allow separation of elements while tracking word boundaries.</ListItem>
                <ListItem>The last two parts handle different types of whitespace, ensuring all spacing is properly captured and tokenized.</ListItem>
            </UnorderedList>
            <Text>
            Applying this regex to our example string yields the following set of sub-strings:
            </Text>

            <Code>["GPT2", " was", " created", " by", " OpenAI"]</Code>
            <Text>
              Note: In GPT-2's tokenizer, the space is represented by 'Ġ' (Unicode U+0120).
            </Text>
    
            <Heading as="h2" size="xl">Step 2: Byte-Pair Encoding (BPE)</Heading>
            <Text>
              Each token then undergoes Byte-Pair Encoding. Befre we run through this example though we need to take a look at two concepts that will be important - the vocabulary, and the merges.  Bth of these are the result of the tokenizer's training process and are used during the tokenization of input text.
              </Text>

             
  
          <Heading as="h3" size="lg">Vocabulary</Heading>
          <Text>
            The vocabulary for GPT2 is stored in a JSON file that maps 50,257 tokens to their corresponding unique integer IDs. It includes individual characters, common subwords, and frequent words.  A few concrete examples are shown below:
          </Text>
            
           
              <Code display="block" whiteSpace="pre" p={2} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md">
                {`{
    "!": 0,
    "\"": 1,
    ...
    "ĠThe": 383,
    ...
    "The": 464,
    ...
    "the": 1169,
    ...
    "<|endoftext|>": 50256
  }`}
              </Code>
              <Text>
            Note here that both capitalisation, and whether there was a preceding space matters! "The" and "the" and " The" are all considered separate tokens within the GPT2 vocabulary.
          </Text>

             < Heading as="h3" size="lg">Merges</Heading>
          <Text>
            There are 50,000 possible merges that we can perform during byte pair encoding. Each entry in the list represents a merge operation, showing which pairs of tokens should be merged. The order of the merges is crucial - it represents the priority of the merges.  The top few merges from the list are shown below:
          </Text>
  
              <Code display="block" whiteSpace="pre" p={2} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md">
                {
`  Ġ t
  Ġ a
  h e
  i n
  r e
  o n
  Ġt he
  ...`}
              </Code>

              <Text>
            These two concepts, the vocab and the merge list, are closely related, and are the result of the same generation process.  If you are wondering why the vocab has slightly more entries (257) than the merges list, it is because the vocabulary also includes 256 entries for all possible bytes (0-255). These are not derived from merges but are included to ensure any byte sequence can be tokenized. and also includes the special"end of text" symbol with ID 50256.  The merges list determines how characters and subwords are combined during tokenisation, and the tokens that result from those merges, along with the additional for extras, are found in the vocabulary.
          </Text>
  
       
          <Text>
            A quick note on the special "&lt;|endoftext|&gt;" token (ID 50256). It's used to mark the end of a document or a segment of text during training and inference, however it isn't typically used during the standard tokenization process of input text.   It's typically added manually to the end of tokenized sequences when preparing training data or generating text. 
          </Text>
  
          <Text>
            The creation of these files was part of the GPT-2 training process.  The process started with a vocabulary of 256 entries representing all possible bytes. The training data (a large corpus of text) was analyzed to find the most frequent character pairs. Starting with individual characters, the most frequent pairs were iteratively merged to form new tokens. Each merge operation was recorded in merges.txt, up to 50,000 merges. The resulting set of tokens (individual bytes, merged pairs, common words) formed the vocabulary in vocab.json.
          </Text>
    
          <Text>
            This process ensures that the tokenizer can handle any byte sequence while also efficiently representing common character combinations and words in the language.
          </Text>
           
            <Text>
              Ok, with that diversion over let's look at how this works for "GPT2" and " OpenAI", including the ranks of different pair combinations:
            </Text>
    
            <Heading as="h3" size="lg">BPE for "GPT2"</Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Step</Th>
                  <Th>Current State</Th>
                  <Th>Pair Ranks</Th>
                  <Th>Chosen Merge</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>1</Td>
                  <Td><Code>["G", "P", "T", "2"]</Code></Td>
                  <Td>
                    (G,P): 16705<br/>
                    (P,T): 11315<br/>
                    (T,2): -1
                  </Td>
                  <Td>(P,T) → "PT"</Td>
                </Tr>
                <Tr>
                  <Td>2</Td>
                  <Td><Code>["G", "PT", "2"]</Code></Td>
                  <Td>
                    (G,PT): -1<br/>
                    (PT,2): -1
                  </Td>
                  <Td>No more merges</Td>
                </Tr>
              </Tbody>
            </Table>
    
            <Heading as="h3" size="lg">BPE for " OpenAI"</Heading>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Step</Th>
                  <Th>Current State</Th>
                  <Th>Pair Ranks</Th>
                  <Th>Chosen Merge</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>1</Td>
                  <Td><Code>["Ġ", "O", "p", "e", "n", "A", "I"]</Code></Td>
                  <Td>
                    (Ġ,O): 185<br/>
                    (O,p): 18002<br/>
                    (p,e): 176<br/>
                    (e,n): 13<br/>
                    (n,A): -1<br/>
                    (A,I): 19930
                  </Td>
                  <Td>(e,n) → "en"</Td>
                </Tr>
                <Tr>
                  <Td>2</Td>
                  <Td><Code>["Ġ", "O", "p", "en", "A", "I"]</Code></Td>
                  <Td>
                    (Ġ,O): 185<br/>
                    (O,p): 18002<br/>
                    (p,en): 3362<br/>
                    (en,A): -1<br/>
                    (A,I): 19930
                  </Td>
                  <Td>(Ġ,O) → "ĠO"</Td>
                </Tr>
                <Tr>
                  <Td>3</Td>
                  <Td><Code>["ĠO", "p", "en", "A", "I"]</Code></Td>
                  <Td>
                    (ĠO,p): 8415<br/>
                    (p,en): 3362<br/>
                    (en,A): -1<br/>
                    (A,I): 19930
                  </Td>
                  <Td>(p,en) → "pen"</Td>
                </Tr>
                <Tr>
                  <Td>4</Td>
                  <Td><Code>["ĠO", "pen", "A", "I"]</Code></Td>
                  <Td>
                    (ĠO,pen): 4692<br/>
                    (pen,A): -1<br/>
                    (A,I): 19930
                  </Td>
                  <Td>(ĠO,pen) → "ĠOpen"</Td>
                </Tr>
                <Tr>
                  <Td>5</Td>
                  <Td><Code>["ĠOpen", "A", "I"]</Code></Td>
                  <Td>
                    (ĠOpen, A): -1<br/>
                    (A,I): 19930
                    </Td>
                    <Td>(A, I) → "AI"</Td>

                </Tr>
                <Tr>
                  <Td>6</Td>
                  <Td><Code>["ĠOpen", "AI"]</Code></Td>
                  <Td>(ĠOpen,AI): -1</Td>
                  <Td>No more merges</Td>
                </Tr>
              </Tbody>
            </Table>
    
            <Text>
              The BPE process stops when no more merges can be applied based on the learned merge rules. The merge with the lowest rank (highest frequency) is chosen at each step.
            </Text>
    
            <Heading as="h2" size="xl">Step 3: Vocabulary Lookup</Heading>
            <Text>
              Finally, each resulting subword is looked up in the vocabulary to convert it to an integer token ID:
            </Text>
            <OrderedList>
              <ListItem><Code>"G" → 38</Code></ListItem>
              <ListItem><Code>"PT" → 11571</Code></ListItem>
              <ListItem><Code>"2" → 17</Code></ListItem>
              <ListItem><Code>"Ġwas" → 373</Code> (includes the preceding space)</ListItem>
              <ListItem><Code>"Ġcreated" → 2726</Code> (includes the preceding space)</ListItem>
              <ListItem><Code>"Ġby" → 416</Code> (includes the preceding space)</ListItem>
              <ListItem><Code>"ĠOpen" → 4946</Code> (includes the preceding space)</ListItem>
              <ListItem><Code>"AI" → 20185</Code></ListItem>
            </OrderedList>
    
            <Heading as="h3" size="lg">Final Output</Heading>
            <Code>[38, 11571, 17, 373, 2726, 416, 4946, 20815]</Code>
    
            <Text>
              This sequence of integer token IDs is what would be fed into the GPT-2 model for processing. This is the process that we now want to actually code up in our tokenizer class.
            </Text>
          </VStack>
        </Box>
      );
  };
const PostContent = () => {
  return (
    <Box width="80%" margin="auto">
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="2xl">GPT2 From Scratch In C++ - Part 1 - Tokenisation</Heading>

        <Text>
          I recently decided that I didn't understand enough about how transformer archiecture really worked.  Given how much i'm using Claude at the moment I really wanted to have a better understanding of what was going on under the hood, so I decided to implement a GPT2 model from scratch in C++.  Although there are already many excellent writeups of implementing GPT2 from scratch out there, I find the best way for me to understand something is to try and explain it to others, so i'm going to write a series of posts going through my implementation, and hopefully in the process both help myself and others.  I tend to approach things from a fairly technical point of view, and to be honest have found a lot of the explanations regarding things like attention (keys and values etc) did little to really help me understand what was actually going on.  
          <br/><br/>
          </Text>

          <Box  maxWidth="100%" width="auto" height="auto">
      <Flex justify="center" align="center" width="30%" height="100%">
        <Box as="img" src={"/images/GPT2/gpt2_overview.svg"} alt="SVG Image" maxWidth="100%" maxHeight="100%" objectFit="contain" />
      </Flex>
    </Box>
          <Text>

         

          Trying to explain the whole process in a single blog post is probably a bit ambitious, so i've broken it down into a few parts.  This first part is going to cover the tokenisation process, which is the first part of the chain that takes of from input to the next predicted token. Tokenisation converts raw text  input (a string) into a vector of tokens (integers) that the model can then do things with. 
        </Text>

        <TokenizationProcess/>

        <Heading as="h2" size="xl">The Tokenizer Class</Heading>

        <Text>
          Let's start by looking at the main structure of our tokenizer class:
        </Text>

        <CodeBlock language="cpp">
{`class tokenizer_t {
private:
    // Encoder: maps tokens to IDs using the vocabulary
    std::map<string_t, int> encoder;
    // Decoder: maps IDs back to tokens
    std::map<int, string_t> decoder;
    // merge_ranks: stores the priority of merge operations
    std::vector<std::pair<string_t, string_t>> merge_ranks;
    // Regex pattern for tokenization - performs initial splitting of input string
    std::regex regex_splitter;
    // Byte-to-unicode mapping
    std::map<uint8_t, char32_t> byte_encoder;

    // Private methods...

public:
    tokenizer_t(const string_t& vocab_file, const string_t& merges_file);

    // Tokenize input text
    std::vector<int> tokenize(const string_t& text);

    // Get strings back from the tokens
    std::vector<string_t> detokenize(const std::vector<int>& tokens);

    // Other public methods...
};`}
        </CodeBlock>

        <Text>
          There isn't much to say here, the class contains all the objects that we are going to need for tokenization:
        </Text>

        <OrderedList spacing={2}>
          <ListItem><strong>encoder:</strong> Maps tokens to their corresponding IDs using the GPT2 vocabulary.</ListItem>
          <ListItem><strong>decoder:</strong> The reverse of encoder, mapping IDs back to tokens.</ListItem>
          <ListItem><strong>merge_ranks:</strong> Stores the priority of merge operations (the merge list) for Byte Pair Encoding.</ListItem>
          <ListItem><strong>regex_splitter:</strong> A regex pattern used to do an initial coarse split of the input text.</ListItem>
          <ListItem><strong>byte_encoder:</strong> A mapping from bytes to unicode characters (more on this in a bit).</ListItem>
        </OrderedList>

        <Heading as="h2" size="xl">Initialization</Heading>

        <Text>
          The constructor for the tokenizer is pased two files, one for the vocabulary and one for the merge list:
        </Text>

        <CodeBlock language="cpp">
{`tokenizer_t::tokenizer_t(const string_t& vocab_file, const string_t& merges_file)
{
    // Load vocabulary from JSON file
    std::ifstream vocab_stream(vocab_file);
    json vocab_json;
    vocab_stream >> vocab_json;
    for (auto it = vocab_json.begin(); it != vocab_json.end(); ++it) {
        int id = it.value();

        // create the encoder entry mapping string -> int
        encoder[it.key()] = id;
        // create the corresponding decoder entry int -> string
        decoder[id] = it.key();
    }

    // Load BPE merges from text file
    std::ifstream merges_stream(merges_file);
    string_t line;
    std::getline(merges_stream, line);  // Skip first line (header)

    while (std::getline(merges_stream, line)) {
        if (line.empty()) {
            break;
        }

        // the merges file is just space separated
        size_t split_pos = line.find(' ');
        if (split_pos == string_t::npos) {
            die("Invalid line in merges file: " + line);
        }

        string_t first = line.substr(0, split_pos);
        string_t second = line.substr(split_pos + 1);

        // Add this merge rule to merge_ranks
        merge_ranks.emplace_back(first, second);
    }

    // Compile regex pattern for tokenization
    regex_splitter = std::regex("'s|'t|'re|'ve|'m|'ll|'d| ?[a-zA-Z]+| ?[0-9]+| ?[^\\s\\w]+|\\s+(?!\\S)|\\s+");
    
    // Initialize byte encoder/decoder
    byte_encoder = bytes_to_unicode();
}`}
        </CodeBlock>

        <Text>
          The constructor then does a few basic things:
        </Text>

        <OrderedList spacing={2}>
          <ListItem>It loads the vocabulary from a JSON file, creating the encoder and decoder mappings.</ListItem>
          <ListItem>It reads the BPE merges from a text file, populating the merge_ranks vector.</ListItem>
          <ListItem>It compiles a regex pattern for initial tokenization.
            </ListItem>
          <ListItem>It initializes the byte_encoder using the bytes_to_unicode() function, which we will go through next.</ListItem>
        </OrderedList>

        <Text>
          There isn't really anything else to say here, so we can move onto the byte-to-unicode mapping.
        </Text>

        <Heading as="h2" size="xl">Byte-to-Unicode Mapping</Heading>

        <Text>
          The bytes_to_unicode() function creates a reversible mapping between byte values (0-255) and Unicode characters:
        </Text>

        <CodeBlock language="cpp">
{`// Function to create byte-to-unicode mapping for GPT-2 tokenization
std::map<uint8_t, char32_t> tokenizer_t::bytes_to_unicode()
{
    // Purpose: Create a specific bijective mapping between byte values (0-255) and Unicode code points.
    // This mapping is designed to be consistent with GPT-2's original tokenization scheme.

    std::vector<uint8_t> bs;
    // Step 1: Add printable ASCII characters (33 to 126, i.e., '!' to '~')
    // Note: We will handl 0-32 (and the other missing values) later
    for (int i = 33; i <= 126; ++i)
        bs.push_back(i);
    // Step 2: Add extended ASCII characters (161 - '¡' to 172 - '¬' and 174 - '®'to 255 - 'ÿ')
    for (int i = 161; i <= 172; ++i)
        bs.push_back(i);
    for (int i = 174; i <= 255; ++i)
        bs.push_back(i);

    // Create a copy of bs to store the Unicode mappings
    std::vector<char32_t> cs(bs.begin(), bs.end());
    int n = 0;
    // Step 3: Map remaining byte values (0-32, 127-160, 173) to Unicode points starting at 256
    // This includes control characters, space, delete, and some extended ASCII characters
    // Mapping these to 256+ ensures:
    // 1. Consistency with GPT-2's original tokenization scheme
    // 2. Clear visual distinction of special characters during debugging
    // 3. Avoidance of potential issues with the way text editors handle control characters
    
    for (int b = 0; b < 256; ++b) {

        // if we have already added this byte, skip it
        if (std::find(bs.begin(), bs.end(), b) != bs.end()) 
            continue;

        bs.push_back(b);
        // Map to Unicode characters starting from 256
        // Note: we add 256 to avoid conflicts with the ASCII range
        cs.push_back(256 + n);
        ++n;
        
    }

    // Create the final mapping
    // Note: We need to use char32_t rather than char to handle Unicode code points over 255
    std::map<uint8_t, char32_t> result;
    for (size_t i = 0; i < bs.size(); ++i) {
        result[bs[i]] = cs[i];
    }
    return result;
}`}
        </CodeBlock>

    <Text>
      This function creates a one-to-one mapping between byte values (the uint8_t type) and Unicode code points (stored as char32_t), and ensures that all 256 possible byte values are represented as printable characters. 

      <br/><br/>

      At first it wasn't really clear to me why this function needed to be so arbtrary looking:
      
      </Text>

      <OrderedList>
        <ListItem>It starts with printable ASCII characters (33 to 126, which are '!' to '~').</ListItem>
        <ListItem>It then includes most of the extended ASCII characters (161 to 172, 174 to 255).</ListItem>
        <ListItem>The remaining byte values (0-32, 127-160, 173) are mapped to Unicode characters starting from code point 256.</ListItem>
    </OrderedList>  

      <Text>
      The reason for this is that it ensures that all bytes can be represented as printable Unicode characters, which is useful for debugging and visualizing the tokenization process.  It also avoids mapping bytes to Unicode control characters (0-31, 127-159) and other special characters like the soft hyphen (173).  These control characters are non-printable characters that control or modify how text and space are processed and displayed.  Some common control characters include:
      </Text>


      <UnorderedList>
            <ListItem>Null: U+0000 (0 in decimal) - Used to terminate strings in many programming languages</ListItem>
            <ListItem>Line Feed (LF): U+000A (10 in decimal) - Used for line breaks, especially in Unix-based systems</ListItem>
            <ListItem>Carriage Return (CR): U+000D (13 in decimal) - Used for line breaks, often in combination with LF in Windows systems</ListItem>
            <ListItem>Delete: U+007F (127 in decimal) - Traditionally used to mark deleted data</ListItem>
          </UnorderedList>

      <Text>

       These characters can cause inconsistent or unexpected text display, data truncation, processing errors, security risks, and debugging challengess.  By avoiding direct mapping to control character code points, this slighty more convoluted process mitigates potential issues in text processing and improves the robustness of the tokenization process.

      <br/><br/>

      This allows for consistent handling of all possible byte values while maintaining a clear distinction between original printable ASCII characters and other byte values.

    </Text>


        <Heading as="h2" size="xl">Tokenization Process</Heading>

        <Text>
          The main tokenization process is handled by the tokenize() method:
        </Text>

        <CodeBlock language="cpp">
{`// Tokenize input text
std::vector<int> tokenizer_t::tokenize(const string_t& text)
{
    std::vector<int> tokens;

    // Use regex to try and split text into smaller chunks
    std::sregex_iterator iter(text.begin(), text.end(), regex_splitter);
    // A default-constructed std::sregex_iterator represents the past-the-end iterator
    std::sregex_iterator end_iter; 

    // while there are chunks left, tokenize them
    while (iter != end_iter) {
        string_t utf8_token = iter->str();

        // Apply byte-level encoding
        std::u32string utf32_token;
        for (uint8_t b : utf8_token) {
            utf32_token += byte_encoder.at(b);
        }

        // Apply BPE encoding
        std::vector<string_t> bpe_encoded = bpe(utf32_token);
        for (const string_t& bpe_token : bpe_encoded) {
            int token_id = encoder.at(bpe_token);
            tokens.push_back(token_id);
        }

        // Move to the next regex match
        ++iter;
    }

    return tokens;
}`}
        </CodeBlock>

        <Text>
          At this point this function is pretty straight forward, and at a high lvl implments the tokenisation process we described at the start of the post:
        </Text>

        <OrderedList spacing={2}>
          <ListItem>It uses the regex pattern to try and split the input text into smaller chunks.</ListItem>
          <ListItem>For each chunk, it applies byte-level encoding using the byte_encoder.</ListItem>
          <ListItem>It then applies Byte Pair Encoding (BPE) to each encoded token.</ListItem>
          <ListItem>Finally, it looks up the integer ID for each BPE token from the vocabulary and adds it to the result.</ListItem>
        </OrderedList>

        <Text>
          There is one slightly funny thing going on here which i think warrants an explanation and has to do with the regex evaluation (surprise..).  Most iterators in C++ have an iter.end() function, and you can just keep going until you reach the end.  The regex iterator is a bit different, and you have to compare it to a default constructed iterator to see if you have reached the end, because it doesn't know how long the iteration is going to be until it is over.  This is why we have to create the end_iter object, and use that in our while loop condition.

          <br/><br/>

          The main thing that is happening here though is the BPE encoding.  This is implemented in the bpe() method, which we will go through next.
        </Text>

        <Heading as="h2" size="xl">Byte Pair Encoding (BPE)</Heading>

        <Text>
          The main workhorse of the tokenization process is the BPE algorithm, implemented in the bpe() method:
        </Text>

        <CodeBlock language="cpp">
{`// performs byte pair encoding on a UTF-32 encoded input
std::vector<string_t> tokenizer_t::bpe(const std::u32string& input)
{
    // Initialize a vector of UTF-32 tokens. 
    // Right now each entry it just a single character from the input, 
    // however these will potentially get merged through the BPE process
    std::vector<std::u32string> tokens;
    tokens.reserve(input.size());
    for (char32_t c : input) {
        tokens.push_back(std::u32string(1, c));
    }

    // Main BPE loop
    while (true) {
        std::pair<std::u32string, std::u32string> best_pair;
        int best_rank = -1;

        // Find the best pair to merge based on rank
        for (size_t i = 0; i < tokens.size() - 1; ++i) {
            // Get the rank of the current pair
            int rank = get_pair_rank(utf32_to_utf8(tokens[i]), utf32_to_utf8(tokens[i + 1]));
            // Update best_pair and best_rank if this pair is better
            if (rank != -1 && (best_rank == -1 || rank < best_rank)) {
                best_pair = {tokens[i], tokens[i + 1]};
                best_rank = rank;
            }
        }

        // If no mergeable pair found, exit the loop
        if (best_rank == -1) {
            break;
        }

        // Merge the best pair of tokens
        std::vector<std::u32string> merged_tokens;
        for (size_t i = 0; i < tokens.size(); ++i) {
            if (i < tokens.size() - 1 && tokens[i] == best_pair.first && tokens[i + 1] == best_pair.second) {
                // Merge the pair
                merged_tokens.push_back(best_pair.first + best_pair.second);
                ++i;  // Skip the next token as it's now merged
            } else {
                // Keep the token as is
                merged_tokens.push_back(tokens[i]);
            }
        }

        // Update word with the new merged version
        tokens = std::move(merged_tokens);
    }

    // Convert the final vector from UTF-32 to UTF-8
    std::vector<string_t> result;
    for (const std::u32string& token : tokens) {
        result.push_back(utf32_to_utf8(token));
    }

    return result;
}`}
        </CodeBlock>

        <Text>
          The BPE algorithm works as follows:
        </Text>

        <OrderedList spacing={2}>
          <ListItem>It starts by splitting the input token into individual characters.</ListItem>
          <ListItem>It then repeatedly finds the most frequent pair of adjacent tokens and merges them.</ListItem>
          <ListItem>This process continues until no more merges can be performed based on the merge_ranks.</ListItem>
          <ListItem>The final result is a sequence of subword tokens.</ListItem>
        </OrderedList>

        <Heading as="h2" size="xl">Conclusion</Heading>

        <Text>
          This tokenizer implementation demonstrates the complexities involved in preparing text for input into a GPT-style model. 
          By using a combination of regex-based initial tokenization, byte-to-unicode mapping, and Byte Pair Encoding, it can 
          efficiently convert raw text into a sequence of token IDs that the model can process.
        </Text>

        <Text>
          The use of BPE allows the model to handle a large vocabulary efficiently, breaking down uncommon words into more common 
          subwords. This approach strikes a balance between the flexibility of character-level models and the efficiency of 
          word-level models.
        </Text>

        <Text>
          Understanding this tokenization process is crucial for anyone working with or implementing large language models, 
          as it forms the bridge between human-readable text and the numerical input that these models process.
        </Text>
      </VStack>
    </Box>
  );
};

export default PostContent;
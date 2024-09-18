import React from 'react';
import { Link, Center, Image, UnorderedList, Box, VStack, Heading, Text, OrderedList, ListItem, Code, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue, Flex } from '@chakra-ui/react';
import { CodeBlock } from '../../components/common/code_highlight';

const EmbeddingProcess = () => {
    return (
        <Box width="100%" margin="auto">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl">GPT-2 Embedding and Unembedding Process</Heading>
    
            <Text>
              In our previous post, we explored the tokenization process in GPT-2. Now, we're moving forward to the next crucial step: embedding. This process transforms our tokenized input into a format suitable for the neural network. We'll also look at the unembedding process, which converts the model's output back into token probabilities.
            </Text>
    
            <Heading as="h2" size="l">What are Embeddings?</Heading>
            <Text>
              Embeddings are a way of representing discrete objects (in our case, tokens) as continuous vectors in a high-dimensional space. The goal is to capture semantic relationships between these objects in the vector space. In GPT-2, we use two types of embeddings:
            </Text>
            <OrderedList>
              <ListItem><strong>Token Embeddings:</strong> These represent the meaning of each token in our vocabulary.</ListItem>
              <ListItem><strong>Position Embeddings:</strong> These encode the position of each token in the input sequence.</ListItem>
            </OrderedList>
    
            <Heading as="h2" size="l">The Embedding Process</Heading>
            <Text>
              Let's look at the main structure of our embedding process within the `forward` method of our GPT2 class:
            </Text>
    
            <CodeBlock language="cpp">
{`Eigen::MatrixXf gpt2_t::forward(string_t input_string)
{
    std::vector<int> tokens = tokenizer.tokenize(input_string);

    Eigen::MatrixXf embedded_tokens(tokens.size(), weights.token_embedding.cols());

    for (size_t i = 0; i < tokens.size(); ++i) {
        // Check if the token ID is within the valid range
        if (tokens[i] >= 0 && tokens[i] < weights.token_embedding.rows()) {
            embedded_tokens.row(i) = weights.token_embedding.row(tokens[i]);
            embedded_tokens.row(i) += weights.position_embedding.row(i);
        } else {
            die("Invalid token ID: " + std::to_string(tokens[i]));
        }
    }

    Eigen::MatrixXf transformer_output = transformer.forward(embedded_tokens);
    
    MatrixXf norm_final_output = final_norm_layer.forward(transformer_output);
    
    MatrixXf logits = norm_final_output * weights.token_embedding.transpose();

    return logits;
}`}
            </CodeBlock>
    
            <Text>
              This method performs a few key steps:
            </Text>
            <OrderedList>
              <ListItem>It tokenizes the input string using our tokenizer (which we covered in the previous post).</ListItem>
              <ListItem>It then applies both token embedding and position embedding to each token.</ListItem>
              <ListItem>The embedded tokens are passed through the transformer layers.</ListItem>
              <ListItem>The output is normalized and then converted back to the vocabulary space (unembedding).</ListItem>
            </OrderedList>
    
            <Heading as="h2" size="l">Token Embeddings</Heading>
            <Text>
              Token embeddings are learned representations of our vocabulary. Each token is associated with a vector of floating-point numbers. The dimensionality of this vector is a hyperparameter of the model - in GPT-2, it's typically 768 for the small model, and larger for bigger variants.
            </Text>
            <CodeBlock language="cpp">
{`embedded_tokens.row(i) = weights.token_embedding.row(tokens[i]);`}
            </CodeBlock>
            <Text>
              This line looks up the embedding vector for a given token ID and assigns it to a row in our `embedded_tokens` matrix.
            </Text>
    
            <Heading as="h2" size="l">Position Embeddings</Heading>
            <Text>
              While token embeddings capture the meaning of individual tokens, they don't encode any information about the position of these tokens in the sequence. This is where position embeddings come in. GPT-2 uses learned position embeddings - vectors that are added to the token embeddings to give the model information about token positions.
            </Text>
            <CodeBlock language="cpp">
{`embedded_tokens.row(i) += weights.position_embedding.row(i);`}
            </CodeBlock>
            <Text>
              This line adds the position embedding for the i-th position to the corresponding token embedding.
            </Text>
    
            <Heading as="h2" size="l">The Unembedding Process</Heading>
            <Text>
              After all the transformer layers have processed our embedded input, we need to convert the high-dimensional output back into the vocabulary space. This process is often called "unembedding". In GPT-2, the unembedding step is performed by multiplying the final layer's output by the transpose of the token embedding matrix:
            </Text>
            <CodeBlock language="cpp">
{`MatrixXf logits = norm_final_output * weights.token_embedding.transpose();`}
            </CodeBlock>
            <Text>
              This operation projects our high-dimensional vectors back onto the axes defined by our token embeddings. The resulting values represent unnormalized scores for each token in our vocabulary.
            </Text>
    
            <Heading as="h2" size="l">From Logits to Next Token</Heading>
            <Text>
              After we've obtained the logits, the final step is to convert these into an actual token prediction. Here's how we do that in our implementation:
            </Text>
            <CodeBlock language="cpp">
{`string_t gpt2_t::get_next_max_like_token(MatrixXf& logits)
{
    Eigen::VectorXf last_token_logits = logits.row(logits.rows() - 1);

    Eigen::VectorXf probabilities = softmax(last_token_logits);

    Eigen::Index max_index;
    probabilities.maxCoeff(&max_index);
    int max_prob_token_id = static_cast<int>(max_index);
    string_t token = tokenizer.detokenize({max_prob_token_id})[0];

    return token;
}`}
            </CodeBlock>
            <Text>
              Let's break this down step by step:
            </Text>
            <OrderedList>
              <ListItem>We extract the logits for the last token in the sequence.</ListItem>
              <ListItem>We apply the softmax function to convert these logits into probabilities.</ListItem>
              <ListItem>We find the index of the highest probability (the argmax).</ListItem>
              <ListItem>We convert this index to a token ID and then detokenize it to get the actual token string.</ListItem>
            </OrderedList>
            <Text>
              This approach always selects the most likely next token, which is known as "greedy" decoding. While simple and often effective, it can lead to repetitive or deterministic outputs.
            </Text>
            
            <Heading as="h3" size="m">Alternative Sampling Strategies</Heading>
            <Text>
              There are several alternative strategies for selecting the next token, which can introduce more variety and potentially improve the quality of generated text:
            </Text>
            <UnorderedList>
              <ListItem><strong>Temperature Sampling:</strong> Instead of always choosing the most likely token, we can sample from the probability distribution. A "temperature" parameter controls how conservative or creative the sampling is. Lower temperatures make the model more confident in its top choices, while higher temperatures make it more likely to pick lower-probability options.</ListItem>
              <ListItem><strong>Top-k Sampling:</strong> This method only considers the k most likely next tokens and redistributes the probability mass among only those tokens before sampling.</ListItem>
              <ListItem><strong>Top-p (or Nucleus) Sampling:</strong> Similar to top-k, but instead of choosing a fixed number of tokens, it chooses the smallest set of tokens whose cumulative probability exceeds a threshold p.</ListItem>
              <ListItem><strong>Beam Search:</strong> This method maintains multiple candidate sequences at each step, allowing the model to look ahead and choose sequences that may be more globally optimal.</ListItem>
            </UnorderedList>
            <Text>
              Each of these methods has its own trade-offs between diversity and quality of the generated text. The choice often depends on the specific application and desired characteristics of the output.
            </Text>

            <Heading as="h2" size="l">Alternative Approaches to Embeddings</Heading>
            <Text>
              While GPT-2 uses the approach described above, there are other ways to handle embeddings in transformer models:
            </Text>
            <UnorderedList>
              <ListItem><strong>Sinusoidal Position Embeddings:</strong> The original Transformer paper used sinusoidal functions to generate position embeddings, rather than learning them.</ListItem>
              <ListItem><strong>Relative Position Embeddings:</strong> Some models, like XLNet, use relative position embeddings instead of absolute ones. This can help the model generalize to longer sequences.</ListItem>
              <ListItem><strong>Factorized Embedding Parameterization:</strong> Some models use a lower-dimensional embedding space and project up to the model dimension. This can reduce the number of parameters, especially for models with large vocabularies.</ListItem>
              <ListItem><strong>Tied Input-Output Embeddings:</strong> Many models, including GPT-2, use the same weight matrix for the input embedding and the output unembedding (transposed). This technique, known as weight tying, can improve performance and reduce the number of parameters.</ListItem>
            </UnorderedList>

            <Heading as="h2" size="l">Why Only Token Embeddings for Unembedding?</Heading>
            <Text>
            You might have noticed that in our unembedding process, we only use the token embeddings and not the position embeddings. This is a deliberate design choice in GPT-2 and similar transformer models, and it's worth exploring why.
            </Text>
            <UnorderedList spacing={2}>
            <ListItem>
                <strong>Nature of embeddings:</strong> Token embeddings represent the meaning of words in our vocabulary, while position embeddings represent the position of a word in a sequence. When we're converting back to token probabilities, we're interested in the meaning, not the position.
            </ListItem>
            <ListItem>
                <strong>Reversibility:</strong> The token embedding process is designed to be reversible - each token corresponds to a unique vector in the embedding space, and vice versa. Position embeddings don't have this one-to-one correspondence with the vocabulary.
            </ListItem>
            <ListItem>
                <strong>Output interpretation:</strong> When we unembed, we're trying to convert the model's output back into probabilities over our vocabulary. We want to know which tokens are most likely, regardless of their position in the sequence.
            </ListItem>
            <ListItem>
                <strong>Information flow:</strong> By the time we reach the output, the positional information has been incorporated into the model's representations through the attention mechanisms in the transformer layers. We no longer need it explicitly for unembedding.
            </ListItem>
            </UnorderedList>
            <Text>
            In essence, the unembedding process is about projecting the model's output back onto the vocabulary space. The token embeddings define this space, while the position embeddings were just a tool to help the model process sequences more effectively.
            </Text>
    
            <Heading as="h2" size="xl">Conclusion</Heading>
            <Text>
              We've now covered the entire process from input text to output token in our GPT-2 implementation. We've seen how tokens are embedded, processed through the transformer layers, converted back to the vocabulary space, and finally selected as concrete tokens.
            </Text>
            <Text>
              Embeddings play a crucial role in transformer models like GPT-2. They allow us to represent discrete tokens as continuous vectors, capturing semantic relationships and positional information. The unembedding process then allows us to convert the model's output back into probabilities over our vocabulary.
            </Text>
            <Text>
              In our next post, we'll dive deeper into the heart of the GPT-2 model: the transformer layers themselves. We'll explore how self-attention and feed-forward networks work together to process our embedded sequences and generate powerful language representations.
            </Text>
            <Text>
              If you found this post useful, or have any questions, please feel free to reach out to me on <a
              style={{ textDecoration: "underline" }} target="_blank"
              href="https://twitter.com/daoplays"
            >X</a>.
            </Text>
          </VStack>
        </Box>
      );
  };

const PostContent = () => {
  return (
    <Box width="80%" margin="auto">
      <VStack spacing={6} align="stretch">
        <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
        GPT2 From Scratch In C++ - Part 2 - Embedding and Unembedding
        </h1>
        <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
          Sept 25 2024
        </h1>

        <Text>
          In our previous post, we explored the tokenization process in GPT-2. Now, we're moving forward to the next crucial step: embedding. This process transforms our tokenized input into a format suitable for the neural network. We'll also look at the unembedding process, which converts the model's output back into token probabilities.
        </Text>

        <Text>
          Below is a high level diagram of the GPT2 architecture (thank you Claude), from an input string all the way down to the probability distribution over next token (the output logits):
        </Text>

        <Box  maxWidth="100%" width="auto" height="auto">
          <Center width="100%" height="100%">
            <Flex justify="center" align="center" width="30%" height="100%">
              <Box as="img" src={"/images/GPT2/gpt2_overview.svg"} alt="SVG Image" maxWidth="100%" maxHeight="100%" objectFit="contain" />
            </Flex>
          </Center>
        </Box>

        <Text>
          In this post, we'll be focusing on the "Token Embedding" and "Position Embedding" boxes at the start of the pipeline, as well as the "Unembedding" step at the end.
        </Text>

        <EmbeddingProcess/>

      </VStack>
    </Box>
  );
};

export default PostContent;
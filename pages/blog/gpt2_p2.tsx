import React from 'react';
import { Link, Center, Image, UnorderedList, Box, VStack, Heading, Text, OrderedList, ListItem, Code, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue, Flex } from '@chakra-ui/react';
import { CodeBlock } from '../../components/common/code_highlight';

const EmbeddingProcess = () => {
    return (
        <Box width="100%" margin="auto">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl">GPT-2 Embedding and Unembedding Process</Heading>

            <Text>

            As with the previous post we'll begin by going through the idea of embeddings and what they are trying to do, before actually starting on the implementation in C++.
          </Text>
            <Heading as="h2" size="l">What are Embeddings?</Heading>
            <Text>
            Embeddings are a key component in virtually all large language models (LLMs), including GPT-2. They are the means by which we can turn an integer token ID into a vector of floating point numbers that the model can actually do something with.  Early word embedding techniques like <a style={{textDecoration: "underline"}} target="_blank" href="https://www.tensorflow.org/text/tutorials/word2vec">Word2Vec</a> and <a style={{textDecoration: "underline"}} target="_blank" href=">https://nlp.stanford.edu/projects/glove/">GloVe</a> were pre-trained separately and then used as fixed inputs to neural networks. In most modern LLMs, however, including GPT-2, BERT, and their successors, embeddings are learned during the training process. This means that the model is able to adjust the vector representation of each token ID to better predict what the next token will be. While <a style={{textDecoration: "underline"}} target="_blank" href="https://nlp.stanford.edu/pubs/hewitt2019structural.pdf">some studies</a>, suggest that these embeddings are capturing syntactic information about the tokens, even that level of interpretation is open to <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/2102.12452">debate</a> in these large models. If you are interested in interpretability though I can recommend pretty much anything by the likes of <a style={{textDecoration: "underline"}} target="_blank" href="https://80000hours.org/podcast/episodes/chris-olah-interpretability-research/">Chris Olah</a>.

            <br/><br/>
           
            
            The size of the embedding vectors is a hyperparameter and will vary from model to model, ranging from a hundreds to thousands of parameters per token.  In the case of GPT-2 there are few different sizes, but we will be dealing with the smallest model, which has a model size of 768 parameters.

            <br/><br/>

            GPT-2 uses two types of embeddings: token embeddings and position embeddings.  There are others, such as segment embeddings, which are used by models like <a  style={{ textDecoration: "underline" }} target="_blank" href="https://arxiv.org/pdf/1810.04805">BERT</a>, but we'll stick to the two used by GPT-2 here.
            </Text>


            <Heading as="h3" size="m">Token Embeddings</Heading>

            <Text>At a high level, token embeddings can be thought of as the floating point representation that encodes the 'meaning' of each token in our vocabulary. This means that the token embedding matrix that needs to be learnt is (vocab size X model size), which for our GPT-2 implementation will be (50796 X 768).  That's about 40 million parameters just for the token embedding!  Fortunately we only care about the forward pass in this post, so we don't need to worry about how to train those parameters, we just need to know how to use the matrix to actually perform the embedding.

            <br/><br/>

            In the previous post in this series we encoded the string "GPT2 was created by OpenAI", which resulted in the set of tokens [38, 11571, 17, 373, 2726, 416, 4946, 20815].  Below is a diagram that illustrates the token embedding process for these tokens:

            </Text>

           
            <Box  maxWidth="100%" width="auto" height="auto">
          <Center width="100%" height="100%">
            <Flex justify="center" align="center" width="80%" height="100%">
              <Box as="img" src={"/images/GPT2/gpt2_token_embedding.svg"} alt="SVG Image" maxWidth="100%" maxHeight="100%" objectFit="contain" />
            </Flex>
          </Center>
        </Box>
        <Text>
            Here, each token ID corresponds to a specific row in the token embedding matrix. 
            We can think of the embedding process as selecting the relevant row for each token (represented by the blue boxes in the middle), maintaining the order of our input sequence, and then combining (stacking) these rows to form the particular embedded token matrix for our input. In our case this matrix has 8 rows (one for each input token) and 768 columns (the embedding dimension).
            <br/><br/>
            To summarise, this process transforms our discrete token IDs into vectors of floating point numbers. The resulting 8 x 768 embedded tokens matrix preserves the sequence of our input while capturing the information that has been learnt about each token, encoded in the embedding matrix. 
            </Text>


            <Heading as="h3" size="m">Position Embeddings</Heading>

            <Text>The second type of embedding used by GPT-2 is position embedding.  As the name suggests, rather than trying to encode semantic information about the tokens, this instead is trying to encode generic, useful information about the position of a token in the input sequence.  
                
            The reason for wanting to add in some kind of position embedding is because otherwise the transformer would always give the same output for the same set of input tokens, regardless of their ordering, i.e. "I walk faster than I run" and "I run faster than I walk" would be treated as the same input and so generate the same next token.  There has been a lot of work done on different ways to perform position embedding, and  <a  style={{ textDecoration: "underline" }} target="_blank" href="https://ar5iv.labs.arxiv.org/html/2102.11090">this paper</a> provides a good overview, covering different examples of absolute and relative embedding methods.
            <br/><br/>
            GPT-2 uses absolute position embedding, meaning that each vector of floating point numbers in the position embedding matrix corresponds to a particular absolute position in the input sequence.  As with the token embedding, the position embedding matrix is also learnt during training, however rather than being of size (vocab size X model size), it is of size (max sequence length X model size), which in the case of GPT-2 this is (1024 X 768).
            <br/><br/>
            The image below illustrates the position embedding process for the same input tokens as above.  It is pretty similar, however rather than taking the row that corresponds to the token ID, we take the row that corresponds to the position of the token in the sequence.  Just to be explicit, this means we grab the first row for the first token, the second row for the second token and so on.
            </Text>

            <Box  maxWidth="100%" width="auto" height="auto">
              <Center width="100%" height="100%">
                <Flex justify="center" align="center" width="80%" height="100%">
                  <Box as="img" src={"/images/GPT2/gpt2_position_embedding.svg"} alt="SVG Image" maxWidth="100%" maxHeight="100%" objectFit="contain" />
                </Flex>
              </Center>
            </Box>
            
            <Text>
              If you are thinking "that seems like a weird way to encode position", I agree with you.  It isn't obvious to me that the absolute position of a token in an input is particularly useful, and <a style={{ textDecoration: "underline" }} target="_blank" href="https://aclanthology.org/2020.emnlp-main.555.pdf">analysis</a> has shown that simply replacing them with random vectors leads to a surprisingly small drop in performance.  It is interesting that fixed position embedding matrices such as the sinusoidal approach have been found to have comparable performance to the learned absolute position embeddings, and I would like to know whether simply having some ordered set of vectors where the position embedding for the i'th position is just a vector of the integer i is equally as good.  <a style={{ textDecoration: "underline" }} target="_blank" href="https://arxiv.org/pdf/2108.12409">This</a> approach simply adds a linearly deceasing bias to the models attention scores, and finds that it performs just as well as learned absolute position embeddings, so it seems plausible that the GPT-2 approach is overparameterised for what it is trying to do.
              
              <br/><br/>
              Before moving on i'll mention one other more recent approach to position embedding: <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/2104.09864">RoPE</a> allows for both absolute and relative information to be encoded, and is used in models like <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/2302.13971">LLaMA</a>, and I intend to implement that myself from scratch in a future post.
            </Text>

    
            <Heading as="h2" size="l">Implementing The Embedding Process</Heading>
            <Text>
              Implementing all the above in code is actually pretty trivial.  To see how we've done it we just need to look at the forward pass for our GPT2 class:
            </Text>
    
            <CodeBlock language="cpp">
{`// In src/gpt2.cpp
Eigen::MatrixXf gpt2_t::forward(string_t input_string)
{
    // get the token ids for this string from the tokenizer
    std::vector<int> tokens = tokenizer.tokenize(input_string);

    // check this doesn't exceed the maximum sequence length (1024 for GPT2)
    if (tokens.size() > max_seq_len) {
        die("Input token sequence is too long");
    }

    // Initialise the embedded tokens matrix with the right size for this set of tokens
    Eigen::MatrixXf embedding_matrix = Eigen::MatrixXf::Zero(tokens.size(), d_model);

    for (size_t i = 0; i < tokens.size(); ++i) {
        // Check if the token ID is within the valid range
        if (tokens[i] >= 0 && tokens[i] < weights.token_embedding.rows()) {
            // for token embedding, take the row corresponding to the token ID
            embedding_matrix.row(i) = weights.token_embedding.row(tokens[i]);
            // for the position embedding, take the row corresponding to the position
            // and add that to the token embedding
            embedding_matrix.row(i) += weights.position_embedding.row(i);
        } else {
            die("Invalid token ID: " + std::to_string(tokens[i]));
        }
    }

    // the token embedding matrix is now ready to be passed to the transformer
    Eigen::MatrixXf transformer_output = transformer.forward(embedding_matrix);

    // pass the transformer output through the final layer normalization
    MatrixXf norm_final_output = final_norm_layer.forward(transformer_output);

    // get the logits by multiplying the final output by the token embedding matrix
    MatrixXf logits = norm_final_output * weights.token_embedding.transpose();

    return logits;
}`}
            </CodeBlock>
            
            <Text>
              Note that we are making use of the fabulous <a style={{textDecoration: "underline"}} target="_blank" href="https://eigen.tuxfamily.org/">Eigen</a> library for handling all our matrix operations, for which the <Code>MatrixXf</Code> type just means a matrix of floating point numbers.  This method performs the entire forward pass for our GPT-2 model:
            </Text>
            <OrderedList>
              <ListItem>It tokenizes the input string using our tokenizer (which we covered in the previous post).</ListItem>
              <ListItem>It then sums both token embedding and position embedding vectors for each token.</ListItem>
              <ListItem>The embedded tokens are passed through the transformer layers.</ListItem>
              <ListItem>The output is normalized and then converted back to the vocabulary space (unembedding).</ListItem>
            </OrderedList>
    
            <Text>
              We can go through the embedding process in a bit more detail: 
              <br/><br/> 
              To perform the token embedding, for the i'th token we take the row corresponding to the ID of that token from the token embedding matrix and assign it to the i'th row in our embedded_tokens matrix:
            </Text>
            <CodeBlock language="cpp">
{`// for token embedding, take the row corresponding to the token ID
embedded_tokens.row(i) = weights.token_embedding.row(tokens[i]);`}
            </CodeBlock>
            
            <Text>
              Even more straightforwardly for the position embedding, for the i'th token we just take the i'th row of the position embedding matrix, and add it to the i'th row of the embedded_tokens matrix: 
            </Text>
            <CodeBlock language="cpp">
{`// for the position embedding, take the row corresponding to the position
// and add that to the token embedding
embedded_tokens.row(i) += weights.position_embedding.row(i);`}
            </CodeBlock>
            <Text>
              That's all there is to it! We have now performed the embedding process and have our input ready for the transformer layers of our network (which we'll cover in the next post).
            </Text>
    
            <Heading as="h2" size="l">The Unembedding Process</Heading>
            <Text>
              After all the transformer layers and the final layer normalisation, we need to convert the output back into the vocabulary space. This process is often called "unembedding". In GPT-2, the unembedding step is performed by multiplying the output by the transpose of the token embedding matrix:
            </Text>
            <CodeBlock language="cpp">
{`// get the logits by multiplying the final output by the token embedding matrix
MatrixXf logits = norm_final_output * weights.token_embedding.transpose();`}
            </CodeBlock>
            <Text>
              This projects our output back onto a space that has the same length as the model's vocabulary, with the values representing unnormalised scores for each token in our vocabulary, referred to as logits.
              This design choice - using the same matrix for both embedding and unembedding - is common amongst language models and is referred to as 
              {" "}<a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1608.05859">
              'weight tying'</a>.  Although it is not strictly necessary - one could have a separate matrix for unembedding - it helps to reduce the number of parameters in the model without having a demonstrably negative impact on performance.
            </Text>

    
            <Heading as="h2" size="l">From Logits to Next Token</Heading>
            <Text>
              After we've obtained the logits, the final step is to convert these into an actual token prediction. Here's how we do that in our implementation:
            </Text>
            <CodeBlock language="cpp">
{`// In src/gpt2.cpp
string_t gpt2_t::get_next_max_like_token(MatrixXf& logits)
{
    // we only want to predict the next token after the input sequence
    // so we take the last row of the logits matrix
    Eigen::VectorXf last_token_logits = logits.row(logits.rows() - 1);

    // convert these logits to probabilities using softmax
    Eigen::VectorXf probabilities = softmax(last_token_logits);

    // in this function we just want to return the token with the highest probability
    // so we find the index of the maximum probability and return the token corresponding to that index
    Eigen::Index max_index;
    probabilities.maxCoeff(&max_index);
    // cast the Index type to an integer
    int max_prob_token_id = static_cast<int>(max_index);

    // finally we detokenize the token ID to get the actual token
    string_t token = tokenizer.detokenize(max_prob_token_id);

    return token;
}`}
            </CodeBlock>
            <Text>
            The first thing we do here is to get the last row from the logits matrix.  This is because the network doesn't just generate scores for the token immediately following our input. Instead, it produces scores for every possible next token at each step of the input sequence.  In other words, for an input of length N, the network calculates N sets of scores: the first set predicts the second token given the first, the second set predicts the third token given the first two, and so on, culminating in the Nth set that predicts the (N+1)th token given all N input tokens.   Although this is very useful in training it isn't so useful for inference so we just grab the last row, which represents the scores for the next token given our complete input sequence.
            </Text>
            

          <Text>
            Once we have our vector of logits (one per token in the models vocabulary) a softmax function is used to convert the logits into probabilities. The softmax function is a common way to normalize a set of values into a probability distribution. It exponentiates each value and then divides by the sum of all the exponentiated values to ensure that the output values sum to 1.  Our implementation of the softmax function is shown below:
          </Text>

            <CodeBlock language="cpp">
{`// In src/utils.cpp
VectorXf softmax(const VectorXf& x)
{
    // use the standard trick of subtracting the maximum value to avoid overflow
    VectorXf exp_x = (x.array() - x.maxCoeff()).exp();
    // return the normalized values
    // the sum of the values will be 1 so they can be interpreted as probabilities
    return exp_x.array() / exp_x.sum();
}`}
            </CodeBlock>

            <Text>
            Note that for numerical stability we perform the common trick of subtracting the maximum value from each element before exponentiating. This prevents overflow issues that can occur when exponentiating large numbers.  
            <br/><br/>
            Softmax is a nice method of computing probabilities from the output logits because it results in the {" "}
            <a style={{textDecoration: "underline"}} target="_blank" href="https://en.wikipedia.org/wiki/Maximum_entropy_probability_distribution">
            maximum entropy distribution</a>  given the constraint that the expected value of the logits  matches the actual logits we have. Said differently, the probabilities we get from softmax assumes the least additional information (maximises entropy), given the constraint that the expected values of the logits should match the actual logits we have. 
            <br/><br/>
            That said, there are other methods of converting logits to probabilities, a couple of examples being the <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1805.10829">SigSoftmax</a> function which combines a sigmoid and softmax, or the <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1511.05042">Spherical Loss</a> family of functions which projects the network's output onto a hypersphere before applying normalization.

            </Text>

            <Text>
              Finally, we find the token with the highest probability using Eigens maxCoeff function.  This uses Eigens built in Index type, and so we need to turn that into a standard int before we can use it to  detokenize the index and get our actual token:
            </Text>

            <CodeBlock language="cpp">
{`// in this function we just want to return the token with the highest probability
// so we find the index of the maximum probability and return the token corresponding to that index
Eigen::Index max_index;
probabilities.maxCoeff(&max_index);
// cast the Index type to an integer
int max_prob_token_id = static_cast<int>(max_index);`}
            </CodeBlock>


            <Text>
              This integer can then be passed to the decoder map from the previous post:
            </Text>


            <CodeBlock language="cpp">
{`// convert a single token back to text
string_t tokenizer_t::detokenize(const int token)
{
    return decoder[token];
    
}`}
            </CodeBlock>


            <Text>
            We now have the token that the model predicts as the most likely next token in the sequence! This approach always selects the most likely next token, which is known as "greedy" decoding. While simple and often effective, it can lead to repetitive or deterministic outputs.  There are  <a style={{textDecoration: "underline"}} target="_blank" href="https://aclanthology.org/P19-1365/">many</a> alternative strategies for selecting the next token, which can introduce more variety and potentially improve the quality of generated text.  We'll just summarise a few below for interests sake, as we didn't actually implement any of these in the code:
            </Text>
            
            
            <UnorderedList>
              <ListItem><strong>
                <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1811.02549">
                Temperature Sampling</a>:</strong> Instead of always choosing the most likely token, we can sample from the probability distribution. A "temperature" parameter controls how conservative or creative the sampling is. Lower temperatures make the model more confident in its top choices, while higher temperatures make it more likely to pick lower-probability options.</ListItem>
              <ListItem><strong><a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1805.04833">Top-K Sampling</a>:</strong> This method only considers the k most likely next tokens and redistributes the probability mass among only those tokens before sampling.</ListItem>
              <ListItem><strong>
                <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1904.09751">Top-p (or Nucleus) Sampling</a>
                :</strong> Similar to top-k, but instead of choosing a fixed number of tokens, it chooses the smallest set of tokens whose cumulative probability exceeds a threshold p.</ListItem>
              <ListItem><strong><a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1610.02424">Beam Search</a>:</strong> This method maintains multiple candidate sequences at each step, allowing the model to look ahead and choose sequences that may be more globally optimal.</ListItem>
            </UnorderedList>
            <Text>
              Each of these methods has its own trade-offs between diversity and quality of the generated text. The choice often depends on the specific application and desired characteristics of the output.
            </Text>
    
            <Heading as="h2" size="xl">Conclusion</Heading>
            <Text>
              We've now covered the entire process from input text to output token in our GPT-2 implementation, albeit with a big gap in the middle where the transformer layers do their thing.
            </Text>
            <Text>
              In this post we looked at how GPT-2 uses both token embeddings and position embeddings to transform discrete token IDs into vectors of floating point numbers that serve as the inputs to the transformer layers.  We also went through the unembedding process, which converts the model's transformer output into the raw scores (logits) for the next token back in the vocabulary space using the same matrix that was used for the token embedding (called weight tying).   Finally we converted these logits into probabilities using the softmax function to get the next token in the sequence.
            </Text>
            <Text>
              In the next and final post in this series, we'll go through these transformer layers. This will mean implementing layer normalisation, self-attention and feed-forward networks, so it may be a long one!
            </Text>
            <Text>
              As ever, if you found this post useful, have any questions, or think you might be interested in some of those upcoming posts, please feel free to reach out, or just follow me on <a
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
          Sept 24 2024
        </h1>

        <Text>
          In our <a style={{ textDecoration: "underline" }} target="_blank"  href="https://www.daoplays.org/blog/gpt2_p1">previous</a> previous post, we went through the tokenization process used by GPT-2. Referring to the high level architecture diagram below, that means that we covered the first couple of boxes, up to the point of having our vector of integer input token IDs.
          <br/><br/>
          The next step then is embedding. This process transforms each of our token IDs into a vector of floating point numbers of length equal to the dimensionality of the model (d_model), which,  in the case of the small variant of GPT-2 that we are recreating, is 768.  Therefore if our input is a sequence of 10 token IDs, that means after embedding we will have a matrix that is (10 x 768), and this matrix will become the input for the transformer layers of the model. For now we are going to skip past those layers so that we can also cover the unembedding process that occurs at the bottom of the diagram, which converts the normalised output of the transformer blocks into 'logits' - raw scores for each token in the vocabulary.  Given it is relatively straight forward we'll then finish the process by converting these logits into probabilities with softmax, so that we can finally get the next token in the sequence.
        </Text>

        <Box  maxWidth="100%" width="auto" height="auto">
          <Center width="100%" height="100%">
            <Flex justify="center" align="center" width="30%" height="100%">
              <Box as="img" src={"/images/GPT2/gpt2_overview.svg"} alt="SVG Image" maxWidth="100%" maxHeight="100%" objectFit="contain" />
            </Flex>
          </Center>
        </Box>

        <Text>
          By the end of this post 'all' that will remain is the content of the transformer blocks themselves (and the final layer norm, but layer norms also feature in the transformer blocks), which we'll save for the final entry in this series.
        </Text>

        <EmbeddingProcess/>

      </VStack>
    </Box>
  );
};

export default PostContent;
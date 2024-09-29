import React from 'react';
import { Link, Center, Image, UnorderedList, Box, VStack, Heading, Text, OrderedList, ListItem, Code, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue, Flex } from '@chakra-ui/react';
import { CodeBlock } from '../../components/common/code_highlight';
import UnderlinedLink from '../../components/common/underlined_link';

const TransformerLayers = () => {
    return (
        <Box width="100%" margin="auto">
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl">GPT-2 Transformer Layers</Heading>

            <Text>
              In our previous two posts, we covered the tokenization process and the embedding/unembedding steps of GPT-2. Now, we're diving into the heart of the model: the transformer layers. These layers are where the magic happens, allowing the model to process and generate text with remarkable coherence and context awareness.
            </Text>

            <Text>
              Before we delve into the specific components, let's discuss some key concepts that are crucial to understanding transformer layers:
            </Text>
           
            <Heading as="h2" size="l">Residual Connections and Skip Connections</Heading>
            <Text>
              Residual neworks were first introduced in the context of {" "}
            <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1512.03385">
            image recognition</a> {" "} where it was shown that they could improve the training of deep networks, compared to the standard practice of passing the output of one layer directly to the next.  
            
            Significant work has gone into trying to understand why this is the case.  For example, <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1712.09913">this</a> paper looks at the surface of the loss function for networks that contain skip connections compared to those that dont, and find that the loss surface is significantly smoother when skip connections are included, which would make it easier to optimize.  It is also believed that skip connections are able to decrease the impact of vanishing gradients, where gradient information from deep networks tends to zero.   <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1605.06431">This</a> paper makes an analagy where residual networks behave as a collection of networks that operate at different depths.  The vanishing gradient problem can be mitigated because there exist short paths for the gradient informaiton to take.
            Other work has looked at the concept of <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1702.08591">"shattering gradients"</a> where the gradients for similar inputs look more like white noise as the depth of the network increases.  They also found that skip connections decreased this effect compared to standard feed forward networks.
            <br/><br/>
            One of the most intersting things about residual networks is that there is a solution for feed forward networks that should be able to replicate exactly the behaviour of the skip networks.  However, training them is sufficiently difficult that they are unable to find those solutions.  With residual networks the identity function (ie just not using the thing that is being skipped) can be trivially learnt.
            <br/><br/>
            
            One last thing we will note about residual networks is that they also reduce the number of failure modes in early training.  THis was explored by {" "}
            <a style={{textDecoration: "underline"}} target="_blank" href="https://arxiv.org/pdf/1803.01719">Hanin & Rolnick (2018)</a>{" "} who found that by correctly initialising the residual 'modules' (i.e. the layers within a skip connection) you can effectively avoid the vanishing/exploding gradient problem.  While this is also true for feed forward networks, residual networks then dont suffer the failure mode that arises from the variance of the gradients between layers growing exponentially with depth once this initialisation is performed, whereas for feed forward networks avoiding this second failure mode depends on the architecture, where the width of the network must grow with the depth.

            <br/><br/>
              Residual connections, also known as skip connections, are a fundamental feature of transformer architectures. They allow information to flow directly from earlier layers to later layers, bypassing the intermediate transformations. This design helps combat the vanishing gradient problem in deep networks and enables the model to learn both simple and complex features.
            </Text>

            <Text>
              In GPT-2, residual connections are used extensively. The output of each sub-layer (attention and feed-forward) is added to its input before being passed to the next layer. This can be represented as:
            </Text>

            <CodeBlock language="cpp">
{`output = sublayer(input) + input`}
            </CodeBlock>

            <Heading as="h2" size="l">Pre-Layer Normalization vs Post-Layer Normalization</Heading>

            <Text>
            Layer normalisation was first introduced in <UnderlinedLink link="https://arxiv.org/pdf/1607.06450" text="Ba et al. (2016)"/> as an alternative to batch normalisation that could be applied to recurrent neural networks.  They found that it significantly aided training, making the process more stable and so reducing the time training taken to achieve a particular loss.  The original transformer paper <UnderlinedLink link="https://arxiv.org/pdf/1706.03762" text="Vaswani et al. (2017)"/> used what is reffered to as a "Post layer-norm" architecture, where layer normalization is applied after the residual connection:
            
            </Text>
            <CodeBlock language="cpp">
{`output = LayerNorm(sublayer(input) + input)`}
                </CodeBlock>

            <OrderedList>
              <ListItem>
                <strong>Post-Layer Normalization:</strong> This is the original approach used in the first transformer paper. Here, layer normalization is applied after the residual connection:
                <CodeBlock language="cpp">
{`output = LayerNorm(sublayer(input) + input)`}
                </CodeBlock>
              </ListItem>
              <ListItem>
                <strong>Pre-Layer Normalization:</strong> This approach, used in GPT-2 and many subsequent models, applies layer normalization before the sublayer:
                <CodeBlock language="cpp">
{`output = sublayer(LayerNorm(input)) + input`}
                </CodeBlock>
              </ListItem>
            </OrderedList>

            <Text>
              Pre-layer normalization has been found to improve training stability and allow for training of deeper networks.
            </Text>

            <Heading as="h2" size="l">Layer Normalization</Heading>
            <Text>
              Layer normalization is a technique used to normalize the inputs across the features. Unlike batch normalization, which normalizes across the batch dimension, layer normalization operates on each individual example, making it more suitable for sequence models like GPT-2.
            </Text>

            <Text>
              Here's a simplified implementation of layer normalization:
            </Text>

            <CodeBlock language="cpp">
{`class LayerNorm {
private:
    float epsilon;
    Eigen::VectorXf gamma, beta;

public:
    LayerNorm(int size, float eps = 1e-5) : epsilon(eps), gamma(Eigen::VectorXf::Ones(size)), beta(Eigen::VectorXf::Zero(size)) {}

    Eigen::MatrixXf forward(const Eigen::MatrixXf& input) {
        Eigen::VectorXf mean = input.rowwise().mean();
        Eigen::VectorXf variance = (input.colwise() - mean).rowwise().squaredNorm() / input.cols();
        Eigen::MatrixXf normalized = (input.colwise() - mean).array().rowwise() / (variance + epsilon).array().sqrt();
        return (normalized.array().rowwise() * gamma.transpose().array()).rowwise() + beta.transpose().array();
    }
};`}
            </CodeBlock>

            <Heading as="h2" size="l">Attention Layer</Heading>
            <Text>
              The attention mechanism is the core of the transformer architecture. It allows the model to focus on different parts of the input sequence when processing each token. GPT-2 uses multi-head attention, which allows the model to attend to information from different representation subspaces at different positions.
            </Text>

            <Text>
              Here's a simplified implementation of the attention mechanism:
            </Text>

            <CodeBlock language="cpp">
{`class Attention {
private:
    int num_heads, head_size;
    Eigen::MatrixXf W_q, W_k, W_v, W_o;

public:
    Attention(int model_dim, int num_heads) : num_heads(num_heads), head_size(model_dim / num_heads) {
        // Initialize weight matrices
    }

    Eigen::MatrixXf forward(const Eigen::MatrixXf& x) {
        int seq_length = x.rows();
        
        // Linear projections
        Eigen::MatrixXf Q = x * W_q;
        Eigen::MatrixXf K = x * W_k;
        Eigen::MatrixXf V = x * W_v;

        // Reshape and transpose for multi-head attention
        Q = Q.reshape(Eigen::array<int, 3>{seq_length, num_heads, head_size}).transpose(Eigen::array<int, 3>{1, 0, 2});
        K = K.reshape(Eigen::array<int, 3>{seq_length, num_heads, head_size}).transpose(Eigen::array<int, 3>{1, 0, 2});
        V = V.reshape(Eigen::array<int, 3>{seq_length, num_heads, head_size}).transpose(Eigen::array<int, 3>{1, 0, 2});

        // Scaled dot-product attention
        Eigen::MatrixXf scores = (Q * K.transpose()) / std::sqrt(head_size);
        Eigen::MatrixXf attention_probs = softmax(scores);
        Eigen::MatrixXf attention_output = attention_probs * V;

        // Reshape and project back to model dimension
        attention_output = attention_output.transpose(Eigen::array<int, 3>{1, 0, 2}).reshape(Eigen::array<int, 2>{seq_length, model_dim});
        return attention_output * W_o;
    }
};`}
            </CodeBlock>

            <Heading as="h2" size="l">Feed-Forward Layer</Heading>
            <Text>
              The feed-forward network in each transformer layer consists of two linear transformations with a ReLU activation in between. This allows the model to introduce non-linearity and increase its representational power.
            </Text>

            <Text>
              Here's a simplified implementation of the feed-forward layer:
            </Text>

            <CodeBlock language="cpp">
{`class FeedForward {
private:
    Eigen::MatrixXf W1, W2;
    Eigen::VectorXf b1, b2;

public:
    FeedForward(int model_dim, int ff_dim) {
        // Initialize weights and biases
    }

    Eigen::MatrixXf forward(const Eigen::MatrixXf& x) {
        return (((x * W1).rowwise() + b1.transpose()).array().max(0) * W2).rowwise() + b2.transpose();
    }
};`}
            </CodeBlock>

            <Heading as="h2" size="l">Putting It All Together</Heading>
            <Text>
              A complete transformer layer in GPT-2 combines these components with residual connections and layer normalization. Here's how a single transformer layer might look:
            </Text>

            <CodeBlock language="cpp">
{`class TransformerLayer {
private:
    LayerNorm ln1, ln2;
    Attention attn;
    FeedForward ff;

public:
    TransformerLayer(int model_dim, int num_heads, int ff_dim) : 
        ln1(model_dim), ln2(model_dim), 
        attn(model_dim, num_heads), 
        ff(model_dim, ff_dim) {}

    Eigen::MatrixXf forward(const Eigen::MatrixXf& x) {
        Eigen::MatrixXf attn_output = x + attn.forward(ln1.forward(x));
        return attn_output + ff.forward(ln2.forward(attn_output));
    }
};`}
            </CodeBlock>

            <Text>
              In the following sections, we'll dive deeper into each of these components, exploring their implementation details and discussing some of the nuances and optimizations that can be applied.
            </Text>

            {/* Add more sections here as needed */}

            <Heading as="h2" size="xl">Conclusion</Heading>
            <Text>
              We've now covered the core components of the transformer layers in GPT-2. These layers are the heart of the model, enabling it to process and generate text with remarkable coherence and context awareness. By implementing these layers in C++, we've gained a deeper understanding of how GPT-2 works under the hood.
            </Text>

            <Text>
              In this series, we've gone from tokenization to embedding, through the transformer layers, and finally to unembedding and token prediction. This journey has given us a comprehensive view of how GPT-2 operates, and hopefully, it has demystified some of the complexities of this powerful language model.
            </Text>

            <Text>
              As always, if you found this post useful, have any questions, or are interested in future posts, please feel free to reach out or follow me on <a style={{ textDecoration: "underline" }} target="_blank" href="https://twitter.com/daoplays">X</a>.
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
        GPT2 From Scratch In C++ - Part 3 - Transformer Layers
        </h1>
        <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
          Sept 30 2024
        </h1>

        <Text>
          In our previous two posts, we covered the tokenization process and the embedding/unembedding steps of GPT-2. Now, we're ready to dive into the heart of the model: the transformer layers. These layers are where the magic happens, allowing the model to process and generate text with remarkable coherence and context awareness.
        </Text>

        <TransformerLayers />

      </VStack>
    </Box>
  );
};

export default PostContent;
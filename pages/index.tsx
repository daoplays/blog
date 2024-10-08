import { Link } from "@chakra-ui/react";

import React from "react";
import { Card, Col, Container } from "react-bootstrap";
import { isMobile } from "react-device-detect";

import logo_no_text from "../components/images/logo_no_text.png";
import matrix from "components/images/matrix.jpg";
import pyth from "components/images/pyth.jpg";
import givingblock from "components/images/givingblock.jpg";
import quicknode from "components/images/quicknode.png";
import pokemon from "components/images/daoplays_pokemon.png";
import solana from "components/images/solana.jpg";
import ML from "components/images/ML.png";
import core from "components/images/core.jpeg";
import gpt2 from "components/images/gpt2.png";

const blog_post_one = {
  title: "DaoPlays is Live!",
  sub_title: "June 28 2022",
  post_text:
    "At DaoPlays we are interested in using blockchain technology to build apps that bring people together. At the moment there isn't much to see, but for now you can check out our blog as we continue to bring our first Solana app into it's public beta on devnet in just a few weeks!",
  image: logo_no_text,
  display_image: !isMobile,
};

const blog_post_two = {
  title: "Generating Random Numbers On The Solana Blockchain",
  sub_title: "July 03 2022",
  post_text:
    "For our next blog post we are discussing on-chain random number generation with Solana.  In particular we'll be benchmarking a few different methods for performing RNG for those times when you just need a bit of random sauce in your DApp.  Depending on how you do it you could save yourself an order of magnitude in compute time!",
  image: matrix,
  display_image: !isMobile,
};

const blog_post_three = {
  title: "Using Pyth To Seed A Random Number Generator",
  sub_title: "July 05 2022",
  post_text:
    "Continuing our random numbers theme,  we extend the previous post by looking at seeding your on-chain random number generator using a combination of Pyth (a price oracle) with the Xorshift and Murmur based methods from the previous post",
  image: pyth,
  display_image: !isMobile,
};

const blog_post_four = {
  title: "A Charitable Solana Token Launch with The Giving Block",
  sub_title: "July 16 2022",
  post_text:
    "We go through the process of setting up a 'pay what you want' token launch where participants get to choose how much of the payment goes to charity, and get a bonus if they pay more than the current average",
  image: givingblock,
  display_image: !isMobile,
};

const blog_post_five = {
  title: "Monitoring the Solana BlockChain in Real Time",
  sub_title: "July 27 2022",
  post_text:
    "Here we describe our process for monitoring the Solana blockchain for interactions with an on-chain program, and then storing those interactions in a database so that we can update the state of an app in real time as each new block is produced.",
  image: quicknode,
  display_image: !isMobile,
};

const blog_post_six = {
  title: "Running A Charitable Token Auction",
  sub_title: "August 16 2022",
  post_text:
    "In this post we are going to build on our previous posts to build a charitable token auction program, where a users chance of winning is proportional to the size of their bid. They will also be able to decide how much of their bid we keep, and how much we donate to charity, as well as selecting which charity we donate to from a set of provided options.",
  image: givingblock,
  display_image: !isMobile,
};

const daoplays_pokemon = {
  title: "DaoPlays.. Pokemon!",
  sub_title: "September 11 2022",
  post_text:
    "We are excited to announce the launch of our first app, DaoPlays Pokemon!  Play through the original Pokemon Red as part of a DAO, with votes for the next move happening in real time on the Solana blockchain, and raise money for a range of great charities!",
  image: pokemon,
  display_image: !isMobile,
};

const token_2022_intro = {
  title: "An Overview of the Solana SPL Token 2022 program (part 1)",
  sub_title: "June 13 2023",
  post_text:
    "The first in a series of posts that introduces the Token-2022 program.  In this part we create an on-chain mint that can handle a subset of the extensions, including automatic transfer fees.",
  image: solana,
  display_image: !isMobile,
};

const transfer_hook = {
  title: "The Solana SPL Token 2022 program (part 2) - Transfer Hook",
  sub_title: "October 16 2023",
  post_text:
    "The next in a series of posts that introduces the Token-2022 program.  We perform a deep dive into one of the most interesting new features - the transfer hook.",
  image: solana,
  display_image: !isMobile,
};

const rlhf_1 = {
  title: "Intro to Reinforcement Learning From Human Feedback (part 1)",
  sub_title: "October 21 2023",
  post_text:
    "RLHF is a very interesting technique for training an AI from human feedback.  This post introduces the basic concepts with a simple example that doesn't need a lot of the technical details from the full implementation.  We'll be able to build on it though over the next few posts to end up with an Agent that can play Atari games using a human to provide feedback on its performance",
  image: ML,
  display_image: !isMobile,
};

const rlhf_2 = {
  title: "Intro to Reinforcement Learning From Human Feedback (part 2)",
  sub_title: "October 21 2023",
  post_text:
    "Continuing on from the previous post, we inrease the complexity of the task by training the reward model on preferences between sequences of states, rather than between single states.  We also add a few extra features from the full implementation - an ensemble of reward models and randomisation of the preferences",
  image: ML,
  display_image: !isMobile,
};

const core_1 = {
  title: "An On-Chain Introduction To Metaplex Core",
  sub_title: "May 01 2024",
  post_text:
    "Metaplex Core is a new standard for creating NFTs on the Solana blockchain.  It is way cheaper, simpler, and offers more functionality than the old SPL standard.  In this post we'll introduce the basics for how to make use of Core on-chain, creating a collection of NFTs with on chain attributes, and transferring them to others.",
  image: core,
  display_image: !isMobile,
};

const options = {
  title: "Trading Options With Metaplex Core",
  sub_title: "May 06 2024",
  post_text:
    "We now extend the previous post and use metaplex core to create an options trading program!",
  image: core,
  display_image: !isMobile,
};

const gpt2_1 = {
    title: "GPT2 From Scratch In C++ - Part 1 - Tokenization",
    sub_title: "Sept 19 2024",
    post_text:
      "First in a series of posts recreating the forward pass of GPT2 in C++ from scratch.  In this post we'll be tokenizing the input text, and converting it into a sequence of integers that can be fed into the model.",
    image: gpt2,
    display_image: !isMobile,
  };
  
const gpt2_2 = {
    title: "GPT2 From Scratch In C++ - Part 2 - Embeddings",
    sub_title: "Sept 24 2024",
    post_text:
        "Second in a series of posts recreating the forward pass of GPT2 in C++ from scratch.  In this post we'll be going through the token and position embedding process that converts our integer token IDs into vectors of floating point numbers that can be passed to the transformer layers.  We'll also go through the unembedding process, converting the output of the transformer layers into probabilities for the next token.",
    image: gpt2,
    display_image: !isMobile,
};
  

function RowCard({ title, sub_title, post_text, image, display_image }) {
  return (
    <Card style={{ flexDirection: "row" }}>
      {display_image && (
        <Card.Img
          style={{ width: "25%", objectFit: "cover" }}
          src={image.src}
          alt="banner"
        />
      )}
      <Card.Body>
        <div>
          <Card.Title
            className="h3 text-center mb-2 pt-2 font-weight-bold text-secondary"
            style={{ fontSize: "3rem" }}
          >
            {title}
          </Card.Title>

          <Card.Subtitle
            className="text-center text-secondary mb-3 font-weight-light text-uppercase"
            style={{ fontSize: "0.8rem" }}
          >
            {sub_title}
          </Card.Subtitle>

          <Card.Text
            className="text-secondary mb-4"
            style={{ fontSize: "1rem" }}
          >
            <br />
            {post_text}
          </Card.Text>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Home() {
  return (
    <>
      <br />
      <br />
      <br />
      <Container>
        <Col>
        <Link href="/blog/gpt2_p2">
            <RowCard {...gpt2_2} />
        </Link>

        <br />

        <Link href="/blog/gpt2_p1">
            <RowCard {...gpt2_1} />
          </Link>

          <br />
          <Link href="/blog/options">
            <RowCard {...options} />
          </Link>

          <br />
          <Link href="/blog/core_p1">
            <RowCard {...core_1} />
          </Link>

          <br />
          <Link href="/blog/rlhf_intro_p1">
            <RowCard {...rlhf_1} />
          </Link>

          <br />
          <Link href="/blog/transfer_hook">
            <RowCard {...transfer_hook} />
          </Link>

          <br />

          <Link href="/blog/intro_token_2022">
            <RowCard {...token_2022_intro} />
          </Link>

          <br />

          <Link href="/blog/pokemon_guide">
            <RowCard {...daoplays_pokemon} />
          </Link>

          <br />

          <Link href="/blog/charity_auction">
            <RowCard {...blog_post_six} />
          </Link>

          <br />
          <Link href="/blog/solana_streamer">
            <RowCard {...blog_post_five} />
          </Link>

          <br />
          <Link href="/blog/charity_token_launch">
            <RowCard {...blog_post_four} />
          </Link>

          <br />
          <Link href="/blog/pyth_seeds">
            <RowCard {...blog_post_three} />
          </Link>

          <br />
          <Link href="/blog/random_numbers">
            <RowCard {...blog_post_two} />
          </Link>

          <br />

          <Link href="/blog/solana_intro">
            <RowCard {...blog_post_one} />
          </Link>
        </Col>
      </Container>
    </>
  );
}

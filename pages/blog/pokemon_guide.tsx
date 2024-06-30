import React from "react";
import { Link, Text, HStack } from "@chakra-ui/react";
import { AiOutlineArrowRight } from "react-icons/ai";

function PostContent() {
    return (
        <div className="container">
            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">DaoPlays Pokemon!</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">September 11th 2022</h1>
            <h2 id="intro-header" className="mt-5" style={{ fontSize: "22px" }}>
                Introduction
            </h2>
            <br />
            !!!Please Note!!! DaoPlays Pokemon has been taken offline. Many thanks to everyone that took part! We hope to build on the
            experiment in the future.
            <br />
            <br />
            Earlier this year we decided that we wanted to teach ourselves about blockchain technology, and formed DaoPlays as a vehicle
            through which we could share what we learn with others along the way. Since then we have been writing a series of blog posts,
            building towards the release of our first app : DaoPlays Pokemon.
            <br />
            <br />
            Inspired by the 2016 event 'Twitch Plays Pokemon', it allows users to play through the original Pokemon Red as a decentralized
            gaming community. Players vote in real time for which move they want to take using 'Play Tokens', and the votes contained within
            every new block produced on the Solana blockchain will determine the next move taken, resulting in a new move roughly once per
            second. The more Play Tokens a user spends on their vote, the more likely it is that their move is the one that takes place,
            however it is never guaranteed as the game uses a proportional voting system (i.e. if one person bids 5 tokens to move up, and
            another bids 10 tokens to move down, the latter is twice as likely, but won't definitely be picked).
            <br />
            <br />
            One of our main goals in developing DaoPlays Pokemon was to make charitable giving a key component of the app. For example, in
            the token launch, users can pay what they want for a block of Play Tokens, and can decide how much stays with us at DaoPlays and
            how much we donate to charity, with all donations handled via{" "}
            <a style={{ textDecoration: "underline" }} href="https://thegivingblock.com/">
                The Giving Block
            </a>
            .
            <br />
            <br />
            In this post we won't be going through the technical aspects of how the app works, however we will reference relevant blog posts
            that do go through the code in detail. Here we will be focussing on how to interact with the app, and a high level overview of
            what it does in the following sections:
            <br />
            <br />
            <ul>
                <li>
                    <HStack>
                        <Text align="center" m="0" p="0">
                            Getting tokens from the token launch (time limited){" "}
                        </Text>
                        <a href="#token_launch-header">
                            <AiOutlineArrowRight />
                        </a>
                    </HStack>
                </li>
                <li>
                    <HStack>
                        <Text align="center" m="0" p="0">
                            Getting tokens from the token auction{" "}
                        </Text>
                        <a href="#token_auction-header">
                            <AiOutlineArrowRight />
                        </a>
                    </HStack>
                </li>
                <li>
                    <HStack>
                        <Text align="center" m="0" p="0">
                            Spending tokens to vote for moves{" "}
                        </Text>
                        <a href="#play_game-header">
                            <AiOutlineArrowRight />
                        </a>
                    </HStack>
                </li>
            </ul>
            <br />
            If you are brand new to Solana we can recommend giving our 'Getting Started With Solana' blog post a read{" "}
            <Link style={{ textDecoration: "underline" }} href="/blog/solana_getting_started">
                here
            </Link>
            . Once you are set up with a wallet such as{" "}
            <a style={{ textDecoration: "underline" }} href="https://phantom.app/">
                Phantom
            </a>
            , you can go and get your SOL either from a centralized exchange like{" "}
            <a style={{ textDecoration: "underline" }} href="https://www.coinbase.com/home">
                Coinbase
            </a>
            , or if you already own other crypto assets from one of the many different decentralized exchanges out there.
            <br />
            <br />
            For those interested, the code for the on-chain programs can be found{" "}
            <a style={{ textDecoration: "underline" }} href="https://github.com/daoplays/pokemon/tree/master">
                here
            </a>
            , and the code for the front end on our website can be found{" "}
            <a style={{ textDecoration: "underline" }} href="https://github.com/daoplays/website">
                here
            </a>
            .
            <br />
            <h3 id="token_launch-header" className="mt-5" style={{ fontSize: "20px" }}>
                Getting Tokens From the Token Launch (Time Limited)
            </h3>
            <br />
            You can read a detailed description of the token launch program{" "}
            <Link style={{ textDecoration: "underline" }} href="/blog/charity_token_launch">
                here
            </Link>
            . This program will only be running for a limited time, but until it closes it is the easiest way to get an initial block of
            1000-2000 Play Tokens. You can find the token launch page{" "}
            <Link style={{ textDecoration: "underline" }} href="/pokemon/token_launch">
                here
            </Link>
            .
            <br />
            <br />
            The token launch allows you to pay whatever you want for a block of 1000 Play Tokens, above a small minimum of 0.0001 SOL (about
            0.3 US cents at time of writing). If you pay above the current average though, you will not only get double the number of Play
            Tokens, but also a DaoPlays Supporter Token. Right now the token launch is the only way to receive Supporter Tokens, which will
            be used in the future to allow owners to take part in governance votes, and potentially to unlock cosmetic features or other
            benefits in future apps.
            <br />
            <br />
            The first time you pay for tokens (either from the token launch, or the auction described in the next section), the program will
            create your token accounts for you. The Solana blockchain requires that a small amount of SOL is deposited in these accounts to
            make them "rent exempt", which means they won't be deleted by the system (see{" "}
            <a style={{ textDecoration: "underline" }} href="https://docs.solana.com/implemented-proposals/rent">
                here
            </a>{" "}
            for more details). This deposit is roughly 0.002 SOL per token account created, and you will see this added onto your payment.
            As you have control of these accounts you will however be able to claim back this deposit if you decide to close them in the
            future.
            <br />
            <br />
            As mentioned in the introduction, after you have set the amount of SOL you would like to pay, you can then decide how much we
            keep, and how much we donate to charity, along with which charity we donate to from a curated list. The stats at the top of the
            page will then update to include your donation, which shows both a summary of all the payments made thus far, and also a break
            down per charity. Currently the way to verify that the charity accounts the program is using are genuine is to publicly announce
            the transactions that send some initial donations to those accounts, and The Giving Block will then publicly verify both that
            those accounts are genuine, and that the donations were received by the correct charities. You can find the tweets announcing
            our initial donations{" "}
            <a style={{ textDecoration: "underline" }} href="https://twitter.com/dao_plays/status/1560632420960849921">
                here
            </a>
            , and The Giving Block's verification of those accounts{" "}
            <a style={{ textDecoration: "underline" }} href="https://twitter.com/TheGivingBlock/status/1560643494556958720">
                here
            </a>
            .
            <h3 id="token_auction-header" className="mt-5" style={{ fontSize: "20px" }}>
                Getting Tokens From The Token Auction
            </h3>
            <br />
            Once the token launch has ended, the only way to get Play Tokens directly from DaoPlays will be through the token auction, which
            you can find at the bottom of the main app page{" "}
            <Link style={{ textDecoration: "underline" }} href="/pokemon">
                here
            </Link>
            . It won't be possible to get Supporter Tokens at all from the auction though, so don't miss out and take part in the token
            launch!
            <br />
            <br />
            You can find a detailed break down of the token auction code{" "}
            <Link style={{ textDecoration: "underline" }} href="/blog/charity_auction">
                here
            </Link>
            . Each auction is for a block of 100 Play Tokens, with new auctions taking place on timescales of seconds to minutes, and
            occurring more frequently as more players take part. The winner of a particular auction is not simply the person who bids the
            most, but instead is randomly chosen with everyone's chance of winning proportional to the size of their bid (i.e. if you bid
            0.1 SOL and someone else bids 0.2 SOL you still have a 33% chance of winning the auction). If you don't win right away your bid
            will remain in the system, and will simply carry over into the next auction provided there are enough unused slots (we will
            explain this below). As with the token launch you can decide how much of your bid goes to charity, and the SOL will be
            transferred at the point the bid is made. When you make your first bid, the program will create a data account that it will use
            to track your position in the auction. As with the token accounts this requires that some SOL is paid into it in order to make
            it rent exempt, which will add an additional cost of around 0.001 SOL to your first bid.
            <br />
            <br />
            All transactions on the Solana blockchain are constrained in terms of the amount of computing resources that they have available
            to them, and as such there are a maximum of 1024 bids that the auction can process at any one time. New bids will be added into
            empty slots if they are available, however if there are no empty slots then the oldest bid at that point will be replaced with
            the new bid, and the original bid is lost. Whenever new winners are selected this frees up space for new bids, and winners are
            chosen more frequently the more bids are present in the auction, so hopefully this situation never happens in practice. The game
            app will however show you the number of bids that need to be made before yours becomes the oldest and is at risk of being lost.
            If it starts to get low you can completely refresh its lifetime by submitting another bid, which will add onto your existing
            bid, increasing your chance of winning in the process.
            <br />
            <br />
            Although the app will attempt to select new winners automatically whenever anyone makes a bid, or spends Play Tokens to vote for
            a move, if there are only a few people playing this may not yield a very responsive auction system. The `send tokens` button
            included in the auction section of the game app allows users to manually select winners and send out tokens if enough time has
            passed since the last winners were selected. When this is pressed any winners that have been selected previously will have their
            tokens sent to them, and the program will then check if new winners can already be selected again. This is particularly helpful
            in the case that only a single person is playing who has no Play Tokens, as they will bid, and be guaranteed to win tokens when
            the next winners can be selected, but will need to use the button to actually trigger that action.
            <br />
            <br />
            The last thing we will add here is that all random numbers generated on chain are seeded using{" "}
            <a style={{ textDecoration: "underline" }} href="https://pyth.network/">
                Pyth
            </a>{" "}
            oracles using the same process we described{" "}
            <a style={{ textDecoration: "underline" }} href="https://www.daoplays.org/blog/pyth_seeds">
                here
            </a>
            . We make sure that a user can't place a bid and be selected as a winner within the same block, as otherwise it would be
            possible for that user to check the value of the oracles, and only bid if they knew they were going to win. As such bids must be
            at least two seconds old before they are included in an auction.
            <h3 id="play_game-header" className="mt-5" style={{ fontSize: "20px" }}>
                Spending Tokens To Vote For Moves
            </h3>
            <br />
            Once you have Play Tokens you can enter how many you want to use to vote for your move in the box below the twitch stream, and
            then just press the button that corresponds to that move. Using your Play Tokens returns them to the pool that the token auction
            uses, and so makes them available to be bid on again.
            <br />
            <br />
            In order for the app to actually take the move, we are monitoring the Solana blockchain using the approach similar to the one we
            described in{" "}
            <Link style={{ textDecoration: "underline" }} href="/blog/solana_streamer">
                this
            </Link>{" "}
            post. Every time a new block is confirmed a move is either taken based on the transactions included in that block, or if there
            were no transactions then no move is taken and time simply advances in the game. Please note that although the Solana blockchain
            is very fast, and it takes very little time for your transaction to be confirmed, there is latency associated with Twitch, and
            so you can expect to wait about ten seconds for the move selected from a given block to be shown in the game stream. You may
            also see that at times the game speeds up and slows down. This occurs whenever the{" "}
            <a style={{ textDecoration: "underline" }} href="https://www.quicknode.com/">
                QuickNode
            </a>{" "}
            endpoint that we are using to monitor the transactions on the block chain lags behind reality slightly. In order to ensure that
            the game is able to catch up again once it has found out what moves it should make, it will increase the game speed, so that
            although all the moves still take up the same number of game frames, it will take less real time to play them. One of our future
            goals is to invest in our own endpoint that we can run locally which will hopefully resolve those issues in the future.
            <br />
            <br />
            Thank you in advance for taking part in DaoPlays Pokemon, and for raising money for these great causes. If you'd like to stay up
            to date with our future apps then please follow us on{" "}
            <a style={{ textDecoration: "underline" }} href="http://www.twitter.com/dao_plays">
                Twitter
            </a>
            .
        </div>
    );
}

function PokemonPost() {
    return <PostContent />;
}

export default PokemonPost;

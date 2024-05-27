import React from "react";

import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code, Text, HStack, Image } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer";
import { AiOutlineArrowRight } from "react-icons/ai";
import attributes from "../../components/blog/resources/Options/optionAttributes.png";

import { OptionsApp } from "../../components/blog/apps/options/App";

function HighLightCode({
  codeBlock,
  language,
}: {
  codeBlock: string;
  language: string;
}) {
  return (
    <Highlight
      theme={themes.shadesOfPurple}
      code={codeBlock}
      language={language}
    >
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function PostContent() {
  return (
    <div className="home" style={{ fontSize: 18 }}>
      <div className="container">
        <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
          Trading Options with Metaplex Core
        </h1>
        <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
          May 10 2024
        </h1>
        <br />
        <br />
        In our last post we introduced Metaplex core - a new standard for
        creating NFTs that is far cheaper and more flexible than the previous
        SPL standard. We now use Core to do something more interesting than just
        creating standard NFTs - we are going to use it to power an options
        trading platform.
        <br />
        <br />
        This won't be a technical post, we are just going to summarise how we
        are using core to drive the backend of the program. In the near future
        Core are going to enable user created plugins for assets that include
        hooks for lifecycle events like transfers and burns. When that happens
        we will update the program here and write a more technical post that
        goes though those new features and allows users to execute their options
        simply by burning them.
        <br />
        <br />
        You'll find the app below, just enter a token mint address that
        exists on devnet (for example,
        BJLX7W73vmUu83uYNW6YLxXwKG5Li4F76pFegHDFGMfb, which you can buy from
        Lets Cook on devnet <a style={{ textDecoration: "underline" }} href="https://devnet.letscook.wtf/trade/SPL2">here</a>) and
        you'll be able to create, trade and execute options with that token as
        an underlying asset.
        <br />
        <br />
        <OptionsApp />
        <h2 id="collections" className="mt-5" style={{ fontSize: "22px" }}>
          Using Collections
        </h2>
        <br />
        Whenever someone creates the first option for a particular token, the
        program will create the collection automatically. The collection is used
        to group all the options for that token, so that front ends can simply
        retrieve all the assets in that collection to display all the options
        that currently exist (this is exactly what the app does above). As an
        example you can check out  {" "}
        <a style={{ textDecoration: "underline" }} href="https://core.metaplex.com/explorer/collection/yjUqZ9zsswj354SDDmEcUTqHRcjMjt5jM7h85fjYDbX?env=devnet">this one</a>.
         The core explorer shows all the members of the collection, and the
        attributes metadata for the collection tells you the token mint address
        that will be the underlying for the collection.
        <h2 id="collections" className="mt-5" style={{ fontSize: "22px" }}>
          Options as Core Assets
        </h2>
        <br />
        Ultimately core assets are just accounts on chain that can contain
        arbitrary data, where the standard makes it easy to interact with those
        accounts, transferring ownership between users, or updating the data. When you create an option is uses the core standard to store all
        of the details for the option in the attributes plugin for the asset.
        This means that the program can access and update that metadata on
        chain. Below you'll see the metadata we store for each option. This
        includes things like the side (Call or Put), the strike price, the
        creator and so on. When you relist an option that you bought previously
        the program will just update the fields for the option price and the
        seller, and this will be displayed in any explorer that supports core
        assets.
        <br />
        <br />
        <Image src={attributes.src} alt="Attributes" />
        <br />
        <br />
        When creating an option either the tokens (if it is a call option) or
        the SOL (if it is a put option) are transferred to an escrow account
        owned by the program. The program is also given both burn and transfer
        delegate status on the asset, so that the original creator is able to
        reclaim it, and the value in the escrow account, after it has expired.
        <h2 id="collections" className="mt-5" style={{ fontSize: "22px" }}>
          Final Comments
        </h2>
        Using the Core standard as a way to package up data that you want to be
        easily viewed in explorers that will work out of the box with wallets is an
        exciting prospect. Although not all wallets and explorers support the
        standard fully just yet, i'm hopeful it will only be a matter of time.
        When user created plugins are available that can act in a similar way to
        the token-2022 transfer hook, but on any life cycle event, that will
        open up even more oppertunities. I looked forward to updating this
        program using the on-burn hook, so that owners of an option just need to
        burn it in their wallet to be able to execute (or refund) the option
        without needing to go via any other interface.
        <br />
        <br />
        If you've learnt something new or found this post useful, go ahead and
        follow us on{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="http://www.X.com/dao_plays"
        >
          X
        </a>{" "}
        to keep up to date with future posts!
        <br />
      </div>
    </div>
  );
}

function CoreP1() {
  return <PostContent />;
}

export default CoreP1;

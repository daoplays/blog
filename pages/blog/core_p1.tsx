import React from "react";
import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code, Text, HStack } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer";
import { AiOutlineArrowRight } from "react-icons/ai";

import { CoreApp } from "../../components/blog/apps/core/coreApp";

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
  const create_collection = `
    CreateCollectionV1CpiBuilder::new(core_program_account_info)
        .collection(asset_account_info)
        .payer(user_account_info)
        .update_authority(Some(user_account_info))
        .name(args.name.to_string())
        .uri(args.uri.to_string())
        .system_program(system_program_account_info)
        .invoke()
        .unwrap();
    `;

  const init_metadata = `
    AddCollectionPluginV1CpiBuilder::new(core_program_account_info)
        .collection(asset_account_info)
        .payer(user_account_info)
        .authority(Some(user_account_info))
        .plugin(mpl_core::types::Plugin::Attributes(
            mpl_core::types::Attributes {
                attribute_list: Vec::new(),
            },
        ))
        .system_program(system_program_account_info)
        .invoke()
        .unwrap();
    `;

  const create_token = `
    CreateV1CpiBuilder::new(core_program_account_info)
        .authority(Some(user_account_info))
        .asset(asset_account_info)
        .collection(Some(collection_account_info))
        .payer(user_account_info)
        .owner(Some(user_account_info))
        .data_state(mpl_core::types::DataState::AccountState)
        .name(args.name.to_string())
        .uri(args.uri.to_string())
        .system_program(system_program_account_info)
        .invoke()
        .unwrap();
    `;

  const init_token_metadata = `
    let collection = mpl_core::Collection::from_bytes(&collection_account_info.data.borrow()[..])?;

    let collection_size = collection.base.num_minted;


    AddPluginV1CpiBuilder::new(core_program_account_info)
        .asset(asset_account_info)
        .collection(Some(collection_account_info))
        .payer(user_account_info)
        .authority(Some(user_account_info))
        .plugin(mpl_core::types::Plugin::Attributes(
            mpl_core::types::Attributes {
                attribute_list: vec![mpl_core::types::Attribute {
                    key: "index".to_string(),
                    value: collection_size.to_string(),
                }],
            },
        ))
        .system_program(system_program_account_info)
        .invoke()
        .unwrap();
    `;

  const update_collection_metadata = `
    let mut collection_attributes = collection
        .plugin_list
        .attributes
        .unwrap()
        .attributes
        .attribute_list;

    collection_attributes.push(mpl_core::types::Attribute {
        key: asset_account_info.key.to_string(),
        value: collection_size.to_string(),
    });

    UpdateCollectionPluginV1CpiBuilder::new(core_program_account_info)
        .collection(collection_account_info)
        .authority(Some(user_account_info))
        .payer(user_account_info)
        .plugin(mpl_core::types::Plugin::Attributes(
            mpl_core::types::Attributes {
                attribute_list: collection_attributes,
            },
        ))
        .system_program(system_program_account_info)
        .invoke()
        .unwrap();
    `;

  const transfer = `
    TransferV1CpiBuilder::new(core_program_account_info)
        .asset(asset_account_info)
        .authority(Some(source_account_info))
        .payer(source_account_info)
        .new_owner(destination_account_info)
        .collection(Some(collection_account_info))
        .system_program(Some(system_program_account_info))
        .invoke()
        .unwrap();
    `;

  return (
    <div className="home" style={{ fontSize: 18 }}>
      <div className="container">
        <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
          An On-Chain Introduction To Metaplex Core
        </h1>
        <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
          May 01 2024
        </h1>
        <br />
        <br />
        Metaplex Core is a new standard that is purpose built for creating and
        managing NFTs, either individually or as part of a collection. No longer
        bogged down by having to use the SPL token infrastructure it is able to
        achieve this far more simply than ever before - the user only has to
        create a single account that represents an NFT, rather than a token
        mint, token account, metadata and master edition accounts. This means it
        takes significantly less code to create NFTs, and on chain it is both
        cheaper, and takes less compute. Metaplex{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://metaplex.com/posts/core-announcement"
        >
          estimate
        </a>{" "}
        it is around 85% more cost effective than the old SPL NFT standard.
        <br />
        <br />
        This also means that guides like this one can be about 85% shorter! I
        think this post probably has the least code in it of all the ones i've
        written, because the process of creating assets on chain has been
        simplified so dramatically by Core.
        <br />
        <br />
        Core also comes with a{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://developers.metaplex.com/core/plugins"
        >
          plugin
        </a>{" "}
        system that is similar in principle to token extensions for SPL Token
        2022 assets. These allow users to extend the base functionality of a
        Core asset, including user created custom plugins. In this post we'll
        only look at one of the simpler plugins - adding attributes
        (string-string key-value pairs) as on-chain metadata, however many
        others already exist including royalty and delegate plugins, with more
        coming in the future including hooks for callbacks on creation, burn or
        transfer events. Over the course of this post we will go through the
        code for an on-chain program that does the following:
        <br />
        <br />
        <ul>
          <li>
            <HStack>
              <Text align="center" m="0" p="0">
                Create a new Collection Asset
              </Text>{" "}
              <a href="#create-collection">
                <AiOutlineArrowRight />
              </a>
            </HStack>
          </li>
          <li>
            <HStack>
              <Text align="center" m="0" p="0">
                Initialize the Collection Attributes plugin so we can later set
                metadata on chain
              </Text>{" "}
              <a href="#init-collection-plugin">
                <AiOutlineArrowRight />
              </a>
            </HStack>
          </li>
          <li>
            <HStack>
              <Text align="center" m="0" p="0">
                Create a new NFT asset that is part of that collection
              </Text>{" "}
              <a href="#init-token-plugin">
                <AiOutlineArrowRight />
              </a>
            </HStack>
          </li>
          <li>
            <HStack>
              <Text align="center" m="0" p="0">
                Update the Collection Attributes
              </Text>{" "}
              <a href="#update-collection">
                <AiOutlineArrowRight />
              </a>
            </HStack>
          </li>
          <li>
            <HStack>
              <Text align="center" m="0" p="0">
                Transfer the asset between users
              </Text>{" "}
              <a href="#transfer">
                <AiOutlineArrowRight />
              </a>
            </HStack>
          </li>
        </ul>
        At the end of the post you'll find a simple UI for interacting with our
        on-chain program running on devnet that implements the code described
        here and will let you test creating assets on Core. Note that currently
        many wallets havn't implemented support for Core yet, so they won't show
        you sending or receving core assets. The UI will include links to the
        metaplex explorer so that you can confirm for yourself that everything
        has actually been created. The code from this example is available{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://github.com/daoplays/solana_examples/tree/master/core/program"
        >
          here
        </a>
        , and the front end code is also available{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://github.com/daoplays/blog/tree/main/components/blog/apps/core"
        >
          here
        </a>
        <h2
          id="create-collection"
          className="mt-5"
          style={{ fontSize: "22px" }}
        >
          Creating a Collection
        </h2>
        You will notice a trend in all of these subsections that pretty much
        everything we want to do just requires a single call to one of the CPI
        builder functions provided by the Core API. In this case we are using
        the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.CreateCollectionV1CpiBuilder.html"
        >
          CreateCollectionV1CpiBuilder
        </a>{" "}
        function. This allows us to point to the traditional off-chain metadata
        file used in the old standard, as well as to set the name of the
        collection on-chain. Note that the metaplex explorer seems to
        preferentially display the name set in the offline metadata, if it
        exists, rather than the on-chain name. We set the update-authority
        explicitly here for clarity, if it is not provided it will just default
        to the fee-payer.
        <br />
        <br />
        <HighLightCode codeBlock={create_collection} language={"rust"} />
        That's all it takes to create a new collection with Core, so much better
        than the old SPL way!
        <h2
          id="init-collection-plugin"
          className="mt-5"
          style={{ fontSize: "22px" }}
        >
          Initialising the Attributes plugin
        </h2>
        To try and make things slightly less trivial we now also initialise one
        of the available plugins for the collection. The{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://developers.metaplex.com/core/plugins/attribute"
        >
          Attributes
        </a>{" "}
        plugin allows you to store and update additional metadata on chain in an{" "}
        <Code p="0">attribute_list</Code> - a vector of string-string key-value
        pairs. We won't actually add any attributes for now, so will just use{" "}
        <Code p="0">Vec::new()</Code> to initialize an empty vector. For this
        task we use the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.AddCollectionPluginV1CpiBuilder.html"
        >
          AddCollectionPluginV1CpiBuilder
        </a>{" "}
        function and for clarity once again explitily set the authority that is
        able to set the plugin data. This needs to be the same as the{" "}
        <Code p="0">update_authority</Code> set in the previous step.
        <br />
        <br />
        <HighLightCode codeBlock={init_metadata} language={"rust"} />
        <h2 id="create-token" className="mt-5" style={{ fontSize: "22px" }}>
          Creating an NFT
        </h2>
        Now that we have our collection we can make an NFT that is part of that
        collection. This is pretty much identical to creating the collection,
        only we call the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.CreateV1CpiBuilder.html"
        >
          CreateV1CpiBuilder
        </a>{" "}
        function. Here we pass the collection account, and again explicitly set
        the authority and owner arguments - both of these will default to the
        fee payer if they arn't set. The authority here must match the
        update_authority for the collection to stop just anyone adding new NFTs
        to a user's collection.
        <br />
        <br />
        <HighLightCode codeBlock={create_token} language={"rust"} />
        <h2
          id="init-token-plugin"
          className="mt-5"
          style={{ fontSize: "22px" }}
        >
          Initialising the Token Attributes
        </h2>
        As with the collection we are going to have some additional on chain
        metadata for our NFT. In this example we are just going to store which
        member of the collection this NFT is as a number, equal to the size of
        the collection when it was created. Handily the collection itself keeps
        track of the number of members it has, both as a total, and also a
        current value (in case members are burnt). We can get this number by
        deserialising the data on the collection account using the API to get a{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/struct.Collection.html"
        >
          Collection
        </a>{" "}
        object.
        <br />
        <br />
        With this in hand, we can simple call the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.AddPluginV1CpiBuilder.html"
        >
          AddPluginV1CpiBuilder
        </a>{" "}
        function to set the metadata on chain.
        <br />
        <br />
        <HighLightCode codeBlock={init_token_metadata} language={"rust"} />
        <h2
          id="update-collection"
          className="mt-5"
          style={{ fontSize: "22px" }}
        >
          Updating the Collection metadata
        </h2>
        With the NFT created, we are now going to update the metadata for the
        collection to contain the address of the asset and its index as a new
        key-value pair. For that we make use of the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.UpdateCollectionPluginV1CpiBuilder.html"
        >
          UpdateCollectionPluginV1CpiBuilder
        </a>{" "}
        function, which will completely overwrite the existing plugin with
        whatever we pass in this instruction. We therefore need to grab the
        existing <Code p="0">attribute_list</Code> from the collection's
        Attribute plugin, add the new value and then use the instruction to
        update the data on chain.
        <br />
        <br />
        This is not super ideal, the metadata extension for token-2022 makes it
        easier to just add or update a single key-value pair in the on-chain
        data, which means less code for the user to write, and also means more
        can be stored. With this implementation the CPI call will fail after
        20-30 bits of metadata as the instruction starts to get too big, however
        hopefully that is something that can be addressed in the near future.
        <br />
        <br />
        <HighLightCode
          codeBlock={update_collection_metadata}
          language={"rust"}
        />
        <h2 id="transfer" className="mt-5" style={{ fontSize: "22px" }}>
          Transferring an NFT
        </h2>
        Finally the last feature we implement in our test program is the{" "}
        <a
          style={{ textDecoration: "underline" }}
          href="https://docs.rs/mpl-core/latest/mpl_core/instructions/struct.TransferV1CpiBuilder.html"
        >
          TransferV1CpiBuilder
        </a>{" "}
        function. This doesn't really need much explanation, you just specify
        the destination, pass the right authorities and it will transfer the NFT
        to the new user. As mentioned previously, at time of writing most
        wallets don't understand Core transfers, and so you won't see it show
        up, but it will be happening in the background.
        <br />
        <br />
        <HighLightCode codeBlock={transfer} language={"rust"} />
        <h2 id="summary" className="mt-5" style={{ fontSize: "22px" }}>
          Summary
        </h2>
        Quite a straight forward post, because Core makes it really easy to get
        up and running with creating collections of assets on Solana. I'll aim
        to write a follow up to this at some point in the near future about some
        of the other features Core brings to the table, such as custom plugins.
        Below you'll find a simple UI for interacting with our toy program on
        chain, which will let you create a collection, and then create and
        transfer assets within that collection.
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
        <br />
        <CoreApp />
        <br />
      </div>
    </div>
  );
}

function CoreP1() {
  return <PostContent />;
}

export default CoreP1;

import React from "react";
import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer"

function HighLightCode({codeBlock, language} : {codeBlock : string, language : string}) {
    return(
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
    const transfer_hook_instructions = 
`
    pub enum TransferHookInstruction {
        Execute {
            amount: u64,
        },
        InitializeExtraAccountMetas,
    }
`;

    const discriminators = 
`
    #[derive(SplDiscriminate)]
    #[discriminator_hash_input("spl-transfer-hook-interface:execute")]
    pub struct ExecuteInstruction;

    #[derive(SplDiscriminate)]
    #[discriminator_hash_input("spl-transfer-hook-interface:initialize-extra-account-metas")]
    pub struct InitializeExtraAccountMetaListInstruction;
`;

    const unpack = 
`
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        if input.len() < ArrayDiscriminator::LENGTH {
            return Err(ProgramError::InvalidInstructionData);
        }
        let (discriminator, rest) = input.split_at(ArrayDiscriminator::LENGTH);
        Ok(match discriminator {
            ExecuteInstruction::SPL_DISCRIMINATOR_SLICE => {
                let amount = rest
                    .get(..8)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u64::from_le_bytes)
                    .ok_or(ProgramError::InvalidInstructionData)?;
                Self::Execute { amount }
            },
            InitializeExtraAccountMetaListInstruction::SPL_DISCRIMINATOR_SLICE => {
                Self::InitializeExtraAccountMetas
            },
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
`;

    const struct_discriminator = 
`
    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
    struct MyPodValue {
        data: [u8; 8],
    }
    impl SplDiscriminate for MyPodValue {
        const SPL_DISCRIMINATOR: ArrayDiscriminator = ArrayDiscriminator::new([1; ArrayDiscriminator::LENGTH]);
    }
`;

    return (
        <div className="home" style={{ fontSize: 18 }}>
            <div className="container">
                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                    An Overview of the Solana SPL Token 2022 program (part 2) - The Transfer Hook
                </h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">August 20 2023</h1>
                <br />
                In the previous post we went over some of the simplest new features of the spl token 2022 program, in particular adding
                extensions to a new mint, and making use of those extensions. In this post we will look at one of the most interesting new
                extensions, the transfer hook. This allows the developer to have a program on chain that is called into every time someone
                transfers a token from a particular mint. This could be used to manage fees for transferring NFTs, or could be used to
                instigate "events" in a game associated with transferring items where bandits might rob you and steal some of your items, or
                for updating metadata associated with a game item, such as evolving a pokemon like character on trade.
                <br />
                <br />
                There are three things that need to be considered when using the transfer hook. Setting up the extension in the mint,
                transferring tokens that make use of the extension, and writing the actual transfer hook program following the required
                interface. All of these make use of recently added functionality within the Solana ecosystem, in particular:
                <ul>
                    <li>Discriminators - a set of bytes that uniquely identify an instruction or struct </li>
                    <li>POD (Plain Old Data) types which allow easy conversion from bytes to supported types</li>
                    <li>Type-Length-Value (TLV) data structures - used to store the set of additional accounts the transfer hook needs.</li>
                    <li>ExtraAccountMetas - the structure that actually holds the extra accounts as a TLV type using Discriminators</li>
                </ul>
                <br />
                Before getting into the implementation of the transfer hook program we will start by describing these four features, and how
                they are used in setting up the transfer hook.
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Discriminators
                </h3>
                The discriminator type is implemented in the spl_discriminator crate which you can find{" "}
                <a style={{ textDecoration: "underline" }} href="https://docs.rs/spl-discriminator/latest/spl_discriminator/">
                    here.
                </a>
                The crate provides macros that allow the users to define a set of bytes to uniquely identify (as examples) instructions that
                exist within a program, or structs that can be deserialised using TLV data types. We will be using them in both these use
                cases in order to set up the transfer hook program. The discriminator is just a set of eight bytes to be defined by the user
                in any way they see fit. The crate provides some useful macros that allow us to make them directly for strings, so for
                example when defining the instructions that the transfer hook program requires, we can use the{" "}
                <Code p="0">discriminator_hash_input</Code> macro to convert the provided strings into the discriminator for
                the trivial structs that will be used to denote the instructions:
                <br />
                <br />
                <HighLightCode codeBlock={discriminators} language={"rust"}/>

                <br />
                <br />
                Similarly when defining a TLV struct, one can add a discriminator to identify its type as in the example
                <a
                    style={{ textDecoration: "underline" }}
                    href="https://docs.rs/spl-type-length-value/0.2.0/spl_type_length_value/state/trait.TlvState.html"
                >
                    here
                </a>{" "}
                where the discriminator is just set to the integer value 1.
                <HighLightCode codeBlock={struct_discriminator} language={"rust"}/>


                <br />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Plain Old Data (POD)
                </h3>
                The POD data type is described in the bytemuck crate{" "}
                <a style={{ textDecoration: "underline" }} href="https://docs.rs/bytemuck/latest/bytemuck/">
                    here.
                </a>{" "}
                Going into the weeds too much on this point is a bit out of scope for this post, but it is usefull to at least mention it's
                existence as you will see the code for the transfer hook makes use of things like
                <Code p="0">
                    {" "}
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-type-length-value/0.2.0/spl_type_length_value/pod/struct.PodBool.html"
                    >
                        PodBool
                    </a>
                </Code>
                , or{" "}
                <Code p="0">
                    {" "}
                    <a
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-tlv-account-resolution/latest/spl_tlv_account_resolution/pod/struct.PodAccountMeta.html"
                    >
                        PodAccountMeta
                    </a>
                </Code>{" "}
                types (i.e. take a type that you are familiar with and add Pod in front to make it new and mysterious). Essentially, by
                stating that a type has the Pod trait, you are stating that it satisfies a series of requirements, for example that the
                structure has no padding bytes, or that you can make a copy simply by copying the bytes. The default Bool type in Rust, and
                the AccountMeta type defined in the Solana crate do not satisfy these requirements, and so special versions have been
                implemented that do.
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Type-Length-Value (TLV)
                </h3>
                TLV is a way of specifying the makeup of a slab of bytes, by specifying the type (8 bytes, using a discriminator), the length of the data (4 bytes), and then following that with the data itself as a slab of bytes of the given length. This way you can easily fill up an array of different data structures, each in the TLV format, and iterate through the structures to deserialise the data.  The type then provides functionality to get the value (i.e to automatically deserialise the bytes to the specified format), or to get the discriminators
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    The ExtraAccountMetas struct
                </h3>
                The transfer hook program requires the user to implement two functions, one that sets up any additional accounts, and the
                main 'Execute' function that is called into evrey time a transfer occurs. Note this first function is required even if you
                don't intend to actually make use of any other accounts within Execute. These two instructions are defined in instuctions.rs
                <br />
                <br />
                <HighLightCode codeBlock={transfer_hook_instructions} language={"rust"}/>


                <br />
                Note that in the transfer hook example, the initialise_extra_account_meta function is passed an argument containing the
                additional account metas. To keep things simpler we don't do that, we just create these AccountMetas explicitly in the code.
                One other thing we have to define for each of these instructions is an instruction discriminator. These require the package
                spl_discriminator https://docs.rs/spl-discriminator/latest/spl_discriminator/, and allow the user to define a series of
                bytes (typically from a string) that explicitly encodes a particular program instruction, rather than just using an integer
                as is more typical. The transfer instruction will call into the hook program using a set descriminator for the Execute
                function, so you need to make sure that you use the correct one. We must also make use of 'type length value' (TLV)
                structures, which are used to store the AccountMeta structures on chain so that they can be accessed from the execute
                function. A TLV structure encodes the type and length of a particular structure, so that it can be deserialised from the
                slab of bytes that follow.
                <br />
                <br />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Test Application
                </h3>
                The application below lets you select any combination of the 5 extensions we have discussed and to mint some tokens using
                the Token-2022 program. Some combinations won't really do much (for example don't bother mixing the Transfer Fee and
                Non-Transferable tokens...) however the transfer fee and interest rate extensions are quite nice to see in practice.
                <br />
                <br />
                <Tokens2022 />
                <br />
                Hopefully you have learnt something new about the Token-2022 program in this post. We'll be following it up with a deep dive
                into one of the most interesting extensions, the Transfer Hook, which enables user code to be called whenever a transfer
                takes place. If you don't to miss that then feel free to follow us on{" "}
                <a style={{ textDecoration: "underline" }} href="http://www.twitter.com/dao_plays">
                    Twitter
                </a>{" "}
                to keep up to date with future posts!
            </div>
        </div>
    );
}

function TransferHook() {
    return (
        <PostContent />
    );
}

export default TransferHook;

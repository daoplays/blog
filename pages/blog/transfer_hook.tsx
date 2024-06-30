import React from "react";
import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code, Link, HStack, Text } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer";
import { AiOutlineArrowRight } from "react-icons/ai";

function HighLightCode({ codeBlock, language }: { codeBlock: string; language: string }) {
    return (
        <Highlight theme={themes.shadesOfPurple} code={codeBlock} language={language}>
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
    const transfer_hook_instructions = `
    pub enum TransferHookInstruction {
        Execute {
            amount: u64,
        },
        InitializeExtraAccountMetaList,
    }
`;

    const discriminators = `
    #[derive(SplDiscriminate)]
    #[discriminator_hash_input("spl-transfer-hook-interface:execute")]
    pub struct ExecuteInstruction;

    #[derive(SplDiscriminate)]
    #[discriminator_hash_input("spl-transfer-hook-interface:initialize-extra-account-metas")]
    pub struct InitializeExtraAccountMetaListInstruction;
`;

    const unpack = `
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        // check first that the input is at least as long as the discriminator (8 bytes)
        if input.len() < ArrayDiscriminator::LENGTH {
            return Err(ProgramError::InvalidInstructionData);
        }
        let (discriminator, rest) = input.split_at(ArrayDiscriminator::LENGTH);
        Ok(match discriminator {
            ExecuteInstruction::SPL_DISCRIMINATOR_SLICE => {
                // unpack the amount that is being transferred
                let amount = rest
                    .get(..8)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u64::from_le_bytes)
                    .ok_or(ProgramError::InvalidInstructionData)?;
                // return an execute instruction for 'amount'
                Self::Execute { amount }
            },
            // initialize extra account metas has no parameters, so just check the discriminator
            InitializeExtraAccountMetaListInstruction::SPL_DISCRIMINATOR_SLICE => {
                // if we have a match then return this instruction
                Self::InitializeExtraAccountMetaList
            },
            // otherwise return an error
            _ => return Err(ProgramError::InvalidInstructionData),
        })
    }
`;

    const struct_discriminator = `
    #[repr(C)]
    #[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
    struct MyPodValue {
        data: [u8; 8],
    }
    impl SplDiscriminate for MyPodValue {
        const SPL_DISCRIMINATOR: ArrayDiscriminator = ArrayDiscriminator::new([1; ArrayDiscriminator::LENGTH]);
    }
`;

    const unpack_account_metas = `
    // get the data from the account that contains the extra account metas
    let data = extra_account_metas_info.data.borrow();
    // unpack this as a TLV state object
    let state = TlvStateBorrowed::unpack(&data[..]).unwrap();
    // get the ExtraAccountMetas object from the TLV state
    let extra_meta_list = ExtraAccountMetaList::unpack_with_tlv_state::<ExecuteInstruction>(&state)?;
    let extra_account_metas = extra_meta_list.data();
`;
    const init_hook_extension = `
    // in processor.rs
    ...

    let config_init_idx =
    spl_token_2022::extension::transfer_hook::instruction::initialize(
        &spl_token_2022::ID,
        &token_mint_account_info.key,
        Some(*funding_account_info.key),
        Some(*transfer_hook_program_account.key),
    )
    .unwrap();

    invoke(
    &config_init_idx,
    &[
        token_program_account_info.clone(),
        token_mint_account_info.clone(),
        funding_account_info.clone(),
        transfer_hook_program_account.clone(),
    ],
    )?;
`;
    const init_account_metas = `
    // in processor.rs
    ...

    let mut account_metas = vec![
        // the account that will hold the extra meta data
        solana_program::instruction::AccountMeta::new(*transfer_hook_validation_account.key, false),
        // this mint account
        solana_program::instruction::AccountMeta::new(*token_mint_account_info.key, false),
        solana_program::instruction::AccountMeta::new(*funding_account_info.key, true),
        solana_program::instruction::AccountMeta::new_readonly(*system_program_account_info.key, false),
    ];

    let mut account_infos = vec![ 
        transfer_hook_validation_account.clone(),
        token_mint_account_info.clone(),
        funding_account_info.clone(),
        system_program_account_info.clone()
    ];

    // check if we added a mint data account
    // in our test this will hold the counter for the number of transfers for this mint
    if mint_data_option.is_some() {
        let mint_data_account_info = mint_data_option.unwrap();
        let mint_data_meta = solana_program::instruction::AccountMeta::new(*mint_data_account_info.key, false);
        account_metas.push(mint_data_meta);

        account_infos.push(mint_data_account_info.clone());
    }

    // pack is defined in instruction.rs and just sets the discriminator for this function
    let instruction_data = TransferHookInstruction::InitializeExtraAccountMetas.pack();

    let init_accounts_idx = solana_program::instruction::Instruction {
        program_id: *transfer_hook_program_account.key,
        accounts: account_metas,
        data: instruction_data,
    };

    invoke(
        &init_accounts_idx,
        &account_infos,
    )?;
`;

    const transfer_1 = `
    // in processor.rs
    ...

    // create a transfer_checked instruction
    // this needs to be mutable because we will manually add extra accounts
    let mut transfer_idx = spl_token_2022::instruction::transfer_checked(
        &spl_token_2022::id(),
        &source_token_account_info.key,
        &mint_account_info.key,
        &dest_token_account_info.key,
        &funding_account_info.key,
        &[&funding_account_info.key],
        metadata.amount,
        3,
    ).unwrap();
`;
    const transfer_2 = `
    // add the three transfer hook accounts
    transfer_idx.accounts.push(AccountMeta::new_readonly(
        *hook_program_account_info.key,
        false,
    ));

    transfer_idx.accounts.push(AccountMeta::new_readonly(
        *validation_account_info.key,
        false,
    ));

    transfer_idx.accounts.push(AccountMeta::new(
        *mint_data_account_info.key,
        false,
    ));

    invoke(
        &transfer_idx,
        &[
            token_program_account_info.clone(),
            source_token_account_info.clone(),
            mint_account_info.clone(),
            dest_token_account_info.clone(),
            funding_account_info.clone(),
            hook_program_account_info.clone(),
            validation_account_info.clone(),
            mint_data_account_info.clone(),
        ],
    )?;
`;

    const init_accounts_1 = `
    // in processor.rs
    pub fn process_initialize_extra_account_metas<'a>(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'a>],
    ) -> ProgramResult {
        
        // get and check the accounts
        ...
`;
    const init_accounts_2 = `

        let mut n_extra_accounts = 0;

        let mut extra_account_infos : Vec<ExtraAccountMeta> = vec![];
        // if we did pass a mint_data account then create that now
        if mint_data_option.is_some() {

            let mint_data_account_info = mint_data_option.unwrap();

            // check the account is what we expect
            let bump_seed = utils::check_program_data_account(
                mint_data_account_info, 
                program_id,
                vec![b"mint_data", &mint_info.key.to_bytes()], "mint_data".to_string()
            ).unwrap();
            
            // we need to create the mint_data account so that it can hold a u64 to count the number
            // of transfers
            // get_mint_data_size is defined in state.rs
            let data_size = state::get_mint_data_size();

            // create the account, this is defined in utils.rs and just makes the PDA
            Self::create_program_account(
                authority_info, 
                mint_data_account_info, 
                program_id, 
                bump_seed, 
                data_size, 
                vec![b"mint_data", &mint_info.key.to_bytes()]
            ).unwrap();
`;
    const init_accounts_2_1 = `
            ...

            // the ExtraAccountMeta needs to know this is a PDA and saves the seeds so that it can
            // check the account.  This is done using the Seed structure.
            let seed1 = Seed::Literal { bytes: b"mint_data".to_vec()};
            let seed2 = Seed::AccountKey { index: 1 };

            // create the ExtraAccountMeta for this account from the seeds
            let mint_account_meta = ExtraAccountMeta::new_with_seeds(&[seed1, seed2], false, true).unwrap();
            extra_account_infos.push(mint_account_meta);

            // increment the account counter
            n_extra_accounts = 1;
        }
`;
    const init_accounts_3 = `
        // given the number of extra accounts, get the size of the ExtraAccountMetaList
        let account_size = ExtraAccountMetaList::size_of(n_extra_accounts)?;

        let lamports = rent::Rent::default().minimum_balance(account_size);

        // create the account
        let ix = solana_program::system_instruction::create_account(
            authority_info.key,
            extra_account_metas_info.key,
            lamports,
            account_size as u64,
            program_id,
        );

        // Sign and submit transaction
        invoke_signed(
            &ix,
            &[authority_info.clone(), extra_account_metas_info.clone()],
            &[&[utils::EXTRA_ACCOUNT_METAS_SEED, mint_info.key.as_ref(), &[bump_seed]]],
        )?;
`;
    const init_accounts_4 = `
        // finally instantiate the data in the account from our extra_account_infos vec
        let mut data = extra_account_metas_info.try_borrow_mut_data()?;
        if  n_extra_accounts == 0 {
            ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &[])?;
        }
        else {
            ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &[extra_account_infos[0]])?;
        }

        Ok(())
    }
`;
    const execute_1 = `
    // in processor.rs
    pub fn process_execute<'a>(
        program_id: &Pubkey,
        accounts: &'a [AccountInfo<'a>],
        _amount: u64,
    ) -> ProgramResult {

        let account_info_iter = &mut accounts.iter();

        // get and check accounts
`;
    const execute_2 = `
        ...

        let data = extra_account_metas_info.data.borrow();

        let state = TlvStateBorrowed::unpack(&data[..]).unwrap();
        let extra_meta_list = ExtraAccountMetaList::unpack_with_tlv_state::<ExecuteInstruction>(&state)?;
        let extra_account_metas = extra_meta_list.data();

        if extra_account_metas.len() > 0 {
            let meta = extra_account_metas[0];

            let mint_data_account_info = next_account_info(account_info_iter)?;

            let mut player_state =
            state::MintData::try_from_slice(&mint_data_account_info.data.borrow()[..])?;

            player_state.count += 1;

            player_state.serialize(&mut &mut mint_data_account_info.data.borrow_mut()[..])?;
        }
        
        Ok(())
    }
`;
    return (
        <div className="home" style={{ fontSize: 18 }}>
            <div className="container">
                <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                    An Overview of the Solana SPL Token 2022 program (part 2) - The Transfer Hook
                </h1>
                <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">October 16 2023</h1>
                <br />
                In our previous post on Token2022 (find it{" "}
                <Link style={{ textDecoration: "underline" }} href="/blog/intro_token_2022">
                    here
                </Link>
                ) we went over some of the simplest new features of the spl token 2022 program. This included extensions like transfer fees
                and interest rates, and how to implement those extensions on chain. In this post we will look at one of the most
                interesting, but more complex, new extensions, the transfer hook. This allows the developer to have a program on chain that
                is called into every time someone transfers a token from a particular mint. This could be used to manage fees for
                transferring NFTs, or could be used to instigate "events" in a game associated with transferring items where bandits might
                rob you and steal some of your items, or for updating metadata associated with a game item, such as evolving a pokemon like
                character on trade (We hope to have a final post in this series where we implement some of these examples).
                <br />
                <br />
                There are three things that need to be considered when implementing the transfer hook:
                <ul>
                    <li>
                        <HStack>
                            <Text align="center" m="0" p="0">
                                Setting up the extension in the mint
                            </Text>{" "}
                            <a href="#init_mint">
                                <AiOutlineArrowRight />
                            </a>
                        </HStack>
                    </li>
                    <li>
                        <HStack>
                            <Text align="center" m="0" p="0">
                                Transferring tokens that make use of the extension
                            </Text>
                            <a href="#transfer_tokens">
                                <AiOutlineArrowRight />
                            </a>
                        </HStack>
                    </li>
                    <li>
                        <HStack>
                            <Text align="center" m="0" p="0">
                                Writing the actual transfer hook program following the required interface{" "}
                            </Text>
                            <a href="#hook_program">
                                <AiOutlineArrowRight />
                            </a>
                        </HStack>
                    </li>
                </ul>
                All of these make use of some recently added functionality within the Solana ecosystem:
                <ul>
                    <li>Discriminators - A set of bytes that uniquely identify an instruction or struct </li>
                    <li>POD (Plain Old Data) - Types which allow easy conversion from bytes to supported types</li>
                    <li>Type-Length-Value (TLV) data structures - Used to store the set of additional accounts the transfer hook needs.</li>
                    <li>ExtraAccountMeta - The structure that actually holds the extra accounts as a TLV type using Discriminators</li>
                </ul>
                <br />
                Therefore, before getting into the implementation of the transfer hook itself, we will start by briefly describing these
                four features, and provide some context for how they are going to be used when setting up the transfer hook.
                <h3 id="discriminators" className="mt-5" style={{ fontSize: "20px" }}>
                    Discriminators
                </h3>
                The discriminator type is implemented in the spl_discriminator crate which you can find{" "}
                <a style={{ textDecoration: "underline" }} href="https://docs.rs/spl-discriminator/latest/spl_discriminator/">
                    here.
                </a>
                The crate provides macros that allow the users to define a set of bytes to uniquely identify things like program
                instructions that will be called externally, or structs that can be deserialised using TLV data types. We will be using them
                in both these use cases in order to set up the transfer hook program.
                <br />
                <br />A discriminator is a set of eight bytes that can be defined by the user in any way they see fit. The crate provides
                some useful macros that allow us to construct them directly from strings, so for example when defining the instructions that
                the transfer hook program requires, we can use the <Code p="0">discriminator_hash_input</Code> macro to convert the provided
                strings into the discriminator for the trivial structs that will be used to denote the instructions:
                <br />
                <br />
                <HighLightCode codeBlock={discriminators} language={"rust"} />
                <br />
                Using this macro provides the struct with the <Code p="0">SPL_DISCRIMINATOR_SLICE</Code> property, which we can use to
                distinguish between instructions. For example, when our transfer hook program is used, we must unpack the input that has
                been sent to the program to check what instruction has been called, and can use this property to do this:
                <HighLightCode codeBlock={unpack} language={"rust"} />
                Likewise by using these discriminators, other programs can call our program and know how to specify which instruction they
                want to call.
                <br />
                Similarly when defining a TLV struct, one can add a discriminator to identify its type as in the example{" "}
                <a
                    style={{ textDecoration: "underline" }}
                    href="https://docs.rs/spl-type-length-value/0.2.0/spl_type_length_value/state/trait.TlvState.html"
                >
                    here
                </a>
                , where the discriminator is just set to the integer value 1.
                <HighLightCode codeBlock={struct_discriminator} language={"rust"} />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Plain Old Data (POD)
                </h3>
                In the above example you can see that we are making use of the 'Pod' attribute for struct <Code p="0">MyPodValue</Code>. The
                POD data type is described in detail in the bytemuck crate{" "}
                <a style={{ textDecoration: "underline" }} href="https://docs.rs/bytemuck/latest/bytemuck/">
                    here.
                </a>{" "}
                Going into the weeds too much on this point is a bit out of scope for this post, but it is usefull to at least mention it's
                existence as you will see the code for the transfer hook makes use of things like{" "}
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
                TLV structures are defined in the{" "}
                <Link style={{ textDecoration: "underline" }} href="https://docs.rs/spl-type-length-value/0.3.0/spl_type_length_value/">
                    this
                </Link>{" "}
                crate, and are used in a{" "}
                <Link style={{ textDecoration: "underline" }} href="https://en.wikipedia.org/wiki/Type%E2%80%93length%E2%80%93value">
                    wide range
                </Link>{" "}
                of applications. They provide a way of specifying the makeup of a slab of bytes, by specifying the type (8 bytes, using a
                discriminator), the length of the data (4 bytes), and then following that with the data itself as a slab of bytes of the
                given length. This way you can easily fill up an array of different data structures, each in the TLV format, and iterate
                through the structures to deserialise the data. The type then provides functionality to get the value (i.e to automatically
                deserialise the bytes to the specified format), or to get the discriminators to check the type. We will give an example of
                this below for the <Code p="0">ExtraAccountMeta</Code> structure.
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    The ExtraAccountMeta struct
                </h3>
                The <Code p="0">ExtraAccountMeta</Code> struct is defined in the{" "}
                <Link
                    style={{ textDecoration: "underline" }}
                    href="https://docs.rs/spl-tlv-account-resolution/latest/spl_tlv_account_resolution/"
                >
                    spl_tlv_account_resolution
                </Link>{" "}
                crate, and is used to hold all the extra account meta data for accounts involved in the transfer hook execution. In the
                simplest case this may not contain any accounts, or it might include accounts that contain meta data that should be updated
                as a result of the transfer. In our example below we will have a single account to decode which will contain the number of
                transfers that have occured for that mint. Each time a transfer occurs, our transfer hook program will increment that
                counter, and so everyone who tries to transfer one of the tokens for that mint will need to know what that account is, so
                that it can be included in the transfer instruction.
                <br />
                <br />
                The combination of all the features discussed so far are used when unpacking this structure in the execute function of the
                transfer hook program, which we will discuss in more detail in the final part of this post:
                <br />
                <br />
                <HighLightCode codeBlock={unpack_account_metas} language={"rust"} />
                <h2 id="init_mint" className="mt-5" style={{ fontSize: "25px" }}>
                    Setting Up The Mint
                </h2>
                Setting up the transfer hook extension in the token mint starts in the same fashion as setting up any of the other
                extensions. You can find the full code for this section in the git repo for the previous blog post{" "}
                <Link
                    style={{ textDecoration: "underline" }}
                    href="https://github.com/daoplays/solana_examples/tree/master/token_2022/program"
                >
                    here
                </Link>{" "}
                here. We first simply have to invoke the{" "}
                <Link
                    style={{ textDecoration: "underline" }}
                    href="https://docs.rs/spl-token-2022/latest/spl_token_2022/extension/transfer_hook/instruction/fn.initialize.html"
                >
                    initialize
                </Link>{" "}
                method for the transfer hook extension:
                <br />
                <br />
                <HighLightCode codeBlock={init_hook_extension} language={"rust"} />
                <br />
                <br />
                Here <Code p="0">transfer_hook_program_account</Code> is the address of the deployed transfer hook program that will be
                called whenever a transfer occurs, which we will describe in the final section below. The extra step that is required to set
                up the transfer hook extension is to then call the function that will set up the meta data that describes the additional
                accounts that should be passed in order to use the transfer hook. We follow the example interface and call this{" "}
                <Code p="0">InitializeExtraAccountMetas</Code>.
                <br />
                <br />
                <HighLightCode codeBlock={init_account_metas} language={"rust"} />
                This follows a pretty standard setup for a CPI call. We have an extra optional account,{" "}
                <Code p="0">mint_data_account_info</Code>, which we will use in this post to count the number of transfers for each mint
                created by the program. This is a unique account per mint, and uses the mint address and the string "mint_data" as the seeds
                (this will be shown explicitly in the transfer hook program section).
                <h2 id="transfer_tokens" className="mt-5" style={{ fontSize: "25px" }}>
                    Transferring Tokens
                </h2>
                Transferring a token that has the transfer hook extension isn't quite as trivial as for the other extensions. The Solana
                blockchain requires that all accounts involved in a transaction are included as part of that transaction, but the default{" "}
                <Code p="0">transfer_checked</Code> function doesn't know anything about our transfer hook program, or the data account that
                we will be modifying when that program is called. We will therefore to modify the instruction before we can invoke it.
                <br />
                <br />
                We start by creating an instance of the <Code p="0">transfer_checked</Code> instruction as normal, except that we have made
                it mutable. This means we can modify the set of accounts the instruction knows about afterwards:
                <br />
                <br />
                <HighLightCode codeBlock={transfer_1} language={"rust"} />
                We can then add in the other accounts that are needed, these are:
                <ul>
                    <li>Out transfer hook program address</li>
                    <li>The address of our ExtraAccountMeta</li>
                    <li>The address of the account that will hold the data we update whenever a transfer occurs</li>
                </ul>
                <br />
                <HighLightCode codeBlock={transfer_2} language={"rust"} />
                <br />
                Once these have been pushed onto the accounts vector for the instruction we can just call invoke and the transfer will
                happen. Note that the <Code p="0">spl_tlv_account_resolution</Code> crate does include some helper functions to do this more
                automatically (e.g. <Code p="0">add_to_cpi_instruction</Code>) however in this case we found it simpler, and more
                instructive to just do it ourselves.
                <h2 id="hook_program" className="mt-5" style={{ fontSize: "25px" }}>
                    The Transfer Hook Program
                </h2>
                In this final section we will implement the transfer hook program itself, the code for this section can be found in our git
                repo{" "}
                <Link style={{ textDecoration: "underline" }} href="https://github.com/daoplays/solana_examples/tree/master/transfer_hook">
                    here
                </Link>
                . In our case we will be building two functions, both of which we have mentioned previously:
                <br />
                <br />
                <ul>
                    <li>Execute - the function called whenever a transfer occurs</li>
                    <li>InitializeExtraAccountMetas - the function that will set up our ExtraAccountMeta data structure on chain</li>
                </ul>
                These two instructions are defined in instuctions.rs:
                <br />
                <br />
                <HighLightCode codeBlock={transfer_hook_instructions} language={"rust"} />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    InitializeExtraAccountMetas
                </h3>
                We will start by going through InitializeExtraAccountMetas, the body of which is defined in{" "}
                <Code p="0">process_initialize_extra_account_metas</Code>:
                <br />
                <br />
                <HighLightCode codeBlock={init_accounts_1} language={"rust"} />
                <br />
                <br />
                In our example the data account that will store the counter is optional, if we don't include it then the transfer hook
                program will still work but won't do anything. We therefore need to check if the account as been passed as an option. When
                creating the account that will hold the extra account meta data we will also need to know the total number of extra accounts
                to get the correct size, so we instantiate the mutable variable <Code p="0">n_extra_accounts</Code> which we will increment
                if we have included the mint data account. If we have included the mint data account then we just get its size from a helper
                function defined in <Code p="0">state.rs</Code> and then create the account as a PDA owned by the transfer hook program.
                Note that we use the mint address as part of the seed so that every mint that uses this program can have its own counter.
                <br />
                <br />
                <HighLightCode codeBlock={init_accounts_2} language={"rust"} />
                <br />
                <br />
                Once the account has been created we then define the <Code p="0">ExtraAccountMeta</Code> structure that will store
                information about that account on chain. The <Code p="0">ExtraAccountMeta</Code> structure has several different methods for
                instantiation depending on the type of account that is being saved. In this case we have made a PDA that is owned by our
                transfer hook program, and so we use the{" "}
                <Code p="0">
                    <Link
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-tlv-account-resolution/latest/spl_tlv_account_resolution/account/struct.ExtraAccountMeta.html#method.new_with_seeds"
                    >
                        new_with_seeds
                    </Link>
                </Code>{" "}
                function, which makes use of the{" "}
                <Code p="0">
                    <Link
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-tlv-account-resolution/latest/spl_tlv_account_resolution/seeds/enum.Seed.html"
                    >
                        Seed
                    </Link>
                </Code>{" "}
                enum to save how to construct the address of the account. In our case we have a<Code p="0">Literal</Code> type seed that
                comes from the text "mint_data", and a seed that comes from an <Code p="0">AccountKey</Code> (the mint account) which is
                defined using the index of that account as it was passed to this function (in our case that was account 1). Using those
                seeds we can instantiate the <Code p="0">ExtraAccountMeta</Code> data and increment <Code p="0">n_extra_accounts</Code>:
                <br />
                <br />
                <HighLightCode codeBlock={init_accounts_2_1} language={"rust"} />
                <br />
                <br />
                That is most of the hard work done. Now we know how many extra accounts we have, we can determine the size of the account
                that will hold that data using the <Code p="0">size_of</Code> function provided by{" "}
                <Code p="0">
                    <Link
                        style={{ textDecoration: "underline" }}
                        href="https://docs.rs/spl-tlv-account-resolution/latest/spl_tlv_account_resolution/state/struct.ExtraAccountMetaList.html"
                    >
                        ExtraAccountMetaList
                    </Link>
                </Code>{" "}
                structure, and then create the account as normal:
                <br />
                <br />
                <HighLightCode codeBlock={init_accounts_3} language={"rust"} />
                <br />
                <br />
                The last step of this function is then to actually initialize the data in this account using the ExtraAccountMeta data
                calculated previously (or using an empty array if we never passed the mint data account):
                <br />
                <br />
                <HighLightCode codeBlock={init_accounts_4} language={"rust"} />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Execute
                </h3>
                The final function to implement then is the Execute function, which is the thing that will actually be called every time a
                transfer occurs. In our case because this either does nothing (if no mint_data was passed when the mint was being created),
                or simply incrments a counter in a data account. As such it is really quite simple. The body of the function is defined in
                the <Code p="0">process_execute</Code> function. Note that this gets passed the amount that has been transferred, however we
                don't use it at all in this example.
                <br />
                <br />
                <HighLightCode codeBlock={execute_1} language={"rust"} />
                <br />
                <br />
                To determine whether we have a mint_data account we check the account that we created in the previous step that contains the{" "}
                <Code p="0">ExtraAccountMetaList</Code>. This involves creating a type-length-value object from the data, and then unpacking
                the bytes as the <Code p="0">ExtraAccountMetaList</Code> object. In our case we only care if there are any accounts so we
                just check the length. If it is greater than zero we know that there must have been a mint data account passed, and so we
                enter that code block.
                <br />
                <br />
                All we then have to do is deserialise the data in that account, increment the value by one, and then serialize it again and
                we are done!
                <br />
                <br />
                <HighLightCode codeBlock={execute_2} language={"rust"} />
                <h3 id="tokens-header" className="mt-5" style={{ fontSize: "20px" }}>
                    Test Application
                </h3>
                The application below lets you select any combination of the extensions we have discussed in this and the previous post and
                to mint some tokens using the Token-2022 program. In particular the transfer hook extension will use our on chain program to
                count the number of transfers that have been made using that mint and display that to the user.
                <br />
                <br />
                <Tokens2022 />
                <br />
                Hopefully you have learnt something new about using the transfer hook with the Token-2022 program in this post. We will aim
                to follow this up at some point with some more interesting examples, such as evolving pokemon type characters in a game. If
                you don't to miss that then go ahead and follow us on{" "}
                <a style={{ textDecoration: "underline" }} href="http://www.twitter.com/dao_plays">
                    Twitter
                </a>{" "}
                to keep up to date with future posts!
            </div>
        </div>
    );
}

function TransferHook() {
    return <PostContent />;
}

export default TransferHook;

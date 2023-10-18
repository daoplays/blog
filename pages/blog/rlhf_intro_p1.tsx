import React from "react";
import { Code, Box, Center, Image, HStack, Text } from '@chakra-ui/react';
import { HighLightCode } from "../../components/common/highlight"
import { AiOutlineArrowRight } from 'react-icons/ai';
import  { MathJax, MathJaxContext } from 'better-react-mathjax';


function PostContent() {

    const gen_db_1 =
`
    n_actions = 5
    actions = {}
    actions[0] = np.array([0,0])
    actions[1] = np.array([0,1])
    actions[2] = np.array([1,0])
    actions[3] = np.array([0,-1])
    actions[4] = np.array([-1,0])
`

    const gen_db_2 =
`
    # for some reason the gym environment can only go between (4,4) and (205, 155)
    x1_min = 4
    x2_min = 4
    x1_max = 205
    x2_max = 155

    segments = []
    n_observations = 10000
    for i in range(n_observations):
        
        obs = np.array([np.random.randint(x1_min, x1_max+1), np.random.randint(x2_min, x2_max+1)])
        a = np.random.randint(0, n_actions)
        next_obs = obs + actions[a]
        segments.append((obs, next_obs, a))
`
    return (

        <div className="container">

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Intro to Reinforcement Learning From Human Feedback (part 1)</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">October 18 2023</h1>
            <br />

            <h2 id="intro-header" className="mt-5" style={{fontSize: "22px"}}>Introduction</h2><br />

            
            
            Deep Reinforcement Learning has been shown over the last few years to be a powerful tool for training agents to act in some environment.  For example, playing videogames etc.  The agent performs actions, the state of the environment is evolved, and periodically it is provided with some reward, e.g for winning the game.  For simple use cases this reward may well capture precisely the thing that we want the agent to learn, however in many interesting cases it is difficult to write down a reward function that describes exactly what we want.

            <br/><br/>

            In the paper they augment deep reinforcement learning by having humans compare pairs of videos that show the agent behaving in different ways, ranking one ahead of the other (or tha they are equal).  From these rankings a reward function can be trained, which can then be used as part of the reinformcenet learning process to provide the reward.  This allowed the authors to train an agent to make a spring do backflips from relatively little human input, and result in a much more effective behaviour than their attempt to hard code a reward function to achieve the same effect.

            <br/><br/>

            Since then RLHF has been used to great effect to fine tune large language models, so that the output is much more usefull to human users, than the 'standard' output of the model (eg..).
            Many posts out there go into detail of how to go about using RLHF in this kind of context, however this is quite a complex use case.

            <br/><br/>

            In this post we will introduce some of the core concepts within RLHF, and apply it to a much simpler problem, a dot that must move towards the center of the screen.  This allows us to leave out much of the detail of the RLHF implementation, but still get the core points across.  In subsequent posts we will expand upon this basic implementation, building towards a setup that lets the user provide feedback in the atari game-playing context.

            <br/><br/>

            The code that we will describe can be found in our GitHub repo for this post <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/RLHF/tree/main/moving_dot">here</a>. 
            
            <br/><br/>
            
            The flow of the monitoring program is as follows:

            <br/><br/>
            <ul>
                <li>
                    <HStack><Text align="center" m="0" p="0">Establish connections to our SQL database and Solana RPC endpoint</Text> <a href="#connect-header"><AiOutlineArrowRight/></a></HStack>
                </li>
                <li>
                    <HStack><Text align="center" m="0" p="0">Determine the correct starting state </Text><a href="#state-header"><AiOutlineArrowRight/></a></HStack>
                </li>
                <li>
                    <HStack><Text align="center" m="0" p="0">Request the set of finalized blocks from the last known entry up to the most recently validated block </Text><a  href="#block-number-header"><AiOutlineArrowRight/></a></HStack>
                </li>
                <li>
                    <HStack><Text align="center" m="0" p="0">Parse the data in those blocks and add new entries to the database </Text><a href="#get-data-header"><AiOutlineArrowRight/></a></HStack>
                </li>
                <li>Repeat the last two steps indefinitely</li>
            </ul>

            <br/>

            We will now go through each of these tasks in detail.
  
            <br/>

            <h3 id="background" className="mt-5" style={{fontSize: "20px"}}>Some Background</h3><br />


            

            <MathJaxContext>
            If we denote an observation <i>i</i> as <MathJax inline>{"\\(o_i\\)"}</MathJax>, and the action taken in that state as  <MathJax inline>{"\\(a_i\\)"}</MathJax>, we can write a sequence of <i>k</i> observation-action pairs as <MathJax inline>{"\\(\\sigma = (o_0, a_0),(o_1,a_1),\\dots,(o_{k-1}, a_{k-1})\\)"}</MathJax>. Humans are asked to compare two such sequences, and to simply state either which is better, or that they are equivalent.  
            </MathJaxContext>

            <MathJaxContext>
            These opinions are then stored in a database and used to train a reward model using supervised learning.  In particular, if we write the total reward for a given sequence {" "}
            
            <MathJax inline>{"\\(R = r(o_0, a_0) + r(o_1,a_1)+\\dots+r(o_{k-1}, a_{k-1})\\)"}</MathJax> then if the user prefers sequence <MathJax inline>{"\\(\\sigma_1\\)"}</MathJax> to sequence <MathJax inline>{"\\(\\sigma_2\\)"}</MathJax>, which they write as <MathJax inline>{"\\( \\sigma_1 \\succ\\sigma_2\\)"}</MathJax> then we want to have <MathJax inline>{"\\( R_1 > R_2\\)"}</MathJax>.
            </MathJaxContext>


         


            <h3 id="preferences" className="mt-5" style={{fontSize: "20px"}}>Generating Preferences</h3><br />

            One of the advantages of using the simple moving dot environment is that preferences can be determined using sequences of only single observation-action pairs.  We use a simple heuristic, that whichever action caused the dot to move closer to the center is preferred, and if the distance closed is the same they are ranked equally.

            <br/><br/>
            Another nice bonus from working with such a simple problem is that we don't even need to use the gym environment itself in order to generate the preferences database.  In total there are five actions that we can take, the null action (do nothing) or moving up, down, left or right.  We create a simple dictionary that maps the index of each action with the movement direction in cartesian coordinates of the pixel.

            <HighLightCode codeBlock={gen_db_1} language={"python"}/>     

            We can then generate a set of random positions, and actions and save these pairs in a list.

            <HighLightCode codeBlock={gen_db_2} language={"python"}/>               
          


            <h3 id="reward" className="mt-5" style={{fontSize: "20px"}}>Learning the Reward Model</h3><br />

            <h3 id="training" className="mt-5" style={{fontSize: "20px"}}>Training the RL Agent</h3><br />



        </div>
    

    );
}

function SolanaStreamer() {
    return (
        <PostContent />                
    );
}

export default SolanaStreamer;

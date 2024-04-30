import React from "react";
import {
  Code,
  VStack,
  Center,
  Image,
  HStack,
  Text,
  Link,
} from "@chakra-ui/react";
import { HighLightCode } from "../../components/common/highlight";
import { AiOutlineArrowRight } from "react-icons/ai";
import { MathJax, MathJaxContext } from "better-react-mathjax";

import reward_training from "../../components/blog/resources/8_RLHF_1/reward_training.gif";
import reward_training_loss from "../../components/blog/resources/8_RLHF_1/training_loss.png";
import reward_loss_img from "../../components/blog/resources/8_RLHF_1/reward_loss.png";
import hopper from "../../components/blog/resources/8_RLHF_1/humanfeedbackjump.gif";
import moving_dot from "../../components/blog/resources/8_RLHF_1/moving_dot.gif";

function PostContent() {
  const gen_db_1 = `    
    n_actions = 5
    actions = {}
    actions[0] = np.array([0,0])
    actions[1] = np.array([0,1])
    actions[2] = np.array([1,0])
    actions[3] = np.array([0,-1])
    actions[4] = np.array([-1,0])
`;

  const gen_db_2 = `
    # for some reason the gym environment can only go between (4,4) and (205, 155)
    y_min = 4
    x_min = 4
    y_max = 205
    x_max = 155

    n_segments = 10000
    segments = []
    for i in range(n_segments):
        
        obs = np.array([np.random.randint(y_min, y_max+1), np.random.randint(x_min, x_max+1)])
        a = np.random.randint(0, n_actions)
        segments.append((obs, a))
`;

  const gen_db_3 = `
    mid_point = np.array([105, 80])
    n_comparisons = 10000
    comparisons = []
    for i in range(n_comparisons):
        chosen_segments = random.sample(segments, 2)
        obs_1, action_1 = chosen_segments[0]
        obs_2, action_2 = chosen_segments[1]

        next_obs_1 = obs_1 + actions[action_1]
        next_obs_2 = obs_2 + actions[action_2]

        move_1 = np.sqrt(np.sum((obs_1 - mid_point)**2)) - np.sqrt(np.sum((next_obs_1 - mid_point)**2))
        move_2 = np.sqrt(np.sum((obs_2 - mid_point)**2)) - np.sqrt(np.sum((next_obs_2 - mid_point)**2))

        mu_1 = 0.5
        mu_2 = 0.5

        # move 1 has got closer to the center than move 2
        if (move_1 > move_2):
            mu_1 = 1
            mu_2 = 0
        
        # move 2 has got closer to the center than move 1
        if (move_2 > move_1):
            mu_1 = 0
            mu_2 = 1

        entry = [len(comparisons), int(obs_1[0]), int(obs_1[1]), int(action_1), int(obs_2[0]), int(obs_2[1]), int(action_2), mu_1, mu_2]
        comparisons.append(entry)
`;

  const reward_network_1 = `
    class RewardModel(nn.Module):
        def __init__(self, input_size):
            super(RewardModel, self).__init__()
            self.hidden_size = 8
            self.network = nn.Sequential(
                layer_init(nn.Linear(input_size, self.hidden_size)),
                nn.Tanh(),
                layer_init(nn.Linear(self.hidden_size, self.hidden_size)),
                nn.Tanh(),
                layer_init(nn.Linear(self.hidden_size, 1), std=1.0),
                nn.Tanh(),

            )

        def get_reward(self, x):
            return self.network(x)

`;

  const reward_network_2 = `
        def get_loss(self, segment_one, segment_two, mu_values):
       
            reward_one = agent.get_reward(segment_one).sum(axis=1).squeeze(1)
            reward_two = agent.get_reward(segment_two).sum(axis=1).squeeze(1)

            mean = 0.5 * (reward_one + reward_two)

            e1 = torch.exp(reward_one - mean) 
            e2 = torch.exp(reward_two - mean) 

            return  -(mu_values[:,0] * reward_one + mu_values[:,1] * reward_two - torch.log(e1 + e2) - mean).sum()
`;

  const reward_training_loop = `
    reward_model = RewardModel(2 + 1).to(device)
    optimizer = optim.Adam(reward_model.parameters(), lr=2.5e-4, eps=1e-5)

    batch_size = 128
    n_epochs = 100000
    for epoch in range(n_epochs):

        entries = np.random.choice(len(preference_table), batch_size, False)
        batch = preference_table[entries]
        s1 = torch.tensor(batch[:,1:4], dtype = torch.float).to(device)
        s2 = torch.tensor(batch[:,4:7], dtype = torch.float).to(device)
        m1 = torch.tensor(batch[:,7], dtype = torch.float).to(device)
        m2 = torch.tensor(batch[:,8], dtype = torch.float).to(device)

        loss = reward_model.get_loss(s1, s2, m1, m2).sum()
        
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
`;

  const reward_randomisation = `
    selected_mu = preference_table_mu[entries]
    if (use_random):
        which = np.random.uniform(0,1,batch_size)  < 0.1
        selected_mu[which] = [0.5,0.5]

    mu_values = torch.tensor(selected_mu, dtype = torch.float).to(device)
`;

  const rlhf_1 = `
    reward_network = None
    if (args.rlhf):
        reward_network = RewardModel(2 + 1).to(device)
        reward_network.load_state_dict(torch.load("./rewards_model"))
        reward_network.eval()
`;

  const rlhf_2 = `
    # if we are using RLHF then we want to replace the reward with the value from the reward network
    if (args.rlhf):
        for i in range(len(reward)):
            reward_input = torch.tensor([new_obs[i][0], new_obs[i][1], action[i]], dtype=torch.float).to(device)
            raw_reward = reward_network.get_reward(reward_input)
            clipped_reward = torch.clamp(raw_reward, -1, 1)
            reward[i] = clipped_reward
`;
  return (
    <div className="container">
      <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
        Intro to Reinforcement Learning From Human Feedback (part 2)
      </h1>
      <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
        October 25 2023
      </h1>
      <br />
      <h2 id="intro-header" className="mt-5" style={{ fontSize: "22px" }}>
        Introduction
      </h2>
      <br />
      In our previous post we introduced some of the basic features of RLHF
      using the moving-dot gym environment. In that case we could create a
      reward model by generating preferences between individual state-action
      pairs, and preferring the state that moved the dot closer to the center.
      For most interesting cases however, individual state-action pairs will not
      include enough information for a human to be able judge which is better.
      In their{" "}
      <Link
        style={{ textDecoration: "underline" }}
        href="https://arxiv.org/pdf/1706.03741.pdf"
      >
        paper
      </Link>{" "}
      (henceforth C17) the authors use sequences of state-action pairs (referred
      to as segment trajectories) and elicit preferences on those, balancing
      longer sequences which have more context, with the training time
      associated with having to learn from those longer sequences.
      <br />
      <br />
      In this post then we will be using the{" "}
      <Link
        style={{ textDecoration: "underline" }}
        href="https://gymnasium.farama.org/environments/classic_control/mountain_car/"
      >
        Mountain Car
      </Link>{" "}
      gym environment and using segment trajectories that each have 30
      state-action pairs, corresponding to about 1 second of video which is
      similar in length to the trajectories in C17. In addition to using
      multiple states, we will also introduce a couple of extra features used in
      C17:
      <br />
      <br />
      <ul>
        <li>
          An ensemble of three reward models - Each is trained separately and we
          average the rewards from the three networks to produce the final
          reward.
        </li>
        <li>
          A 10% chance of replacing the probability distribution of the
          preferences for a particular pair of trajectory segments with 50/50.
        </li>
      </ul>
      The code that we will describe can be found in our GitHub repo for this
      post{" "}
      <a
        style={{ textDecoration: "underline" }}
        href="https://github.com/daoplays/RLHF/tree/main/mountain_car"
      >
        here
      </a>
      .
      <br />
      <br />
      The rest of the post will be organised as follows:
      <br />
      <br />
      <ul>
        <li>
          <HStack>
            <Text align="center" m="0" p="0">
              Some technical background on the RLHF implementation
            </Text>{" "}
            <a href="#background">
              <AiOutlineArrowRight />
            </a>
          </HStack>
        </li>
        <li>
          <HStack>
            <Text align="center" m="0" p="0">
              Generating the preferences database{" "}
            </Text>
            <a href="#preferences">
              <AiOutlineArrowRight />
            </a>
          </HStack>
        </li>
        <li>
          <HStack>
            <Text align="center" m="0" p="0">
              Training a reward model using those preferences
            </Text>
            <a href="#reward">
              <AiOutlineArrowRight />
            </a>
          </HStack>
        </li>
        <li>
          <HStack>
            <Text align="center" m="0" p="0">
              Training our mountain car agent given the reward model{" "}
            </Text>
            <a href="#training">
              <AiOutlineArrowRight />
            </a>
          </HStack>
        </li>
      </ul>
      <h3 id="background" className="mt-5" style={{ fontSize: "20px" }}>
        Some Background
      </h3>
      <br />
      Although we don't want to get too much into the weeds of the technical
      background that frames RLHF, there are some definitions and terminology
      from C17 that will be usefull in this post.
      <br />
      <br />
      <MathJaxContext>
        First, if we denote the <i>i</i>th observation of a particular
        environment as <MathJax inline>{"\\(o_i\\)"}</MathJax>, and the action
        taken as a result of making that observation as{" "}
        <MathJax inline>{"\\(a_i\\)"}</MathJax>, we can write a sequence of{" "}
        <i>k</i> observation-action pairs, a <i>trajectory segment</i>, as{" "}
        <MathJax inline>
          {"\\(\\sigma = (o_0, a_0),(o_1,a_1),\\dots,(o_{k-1}, a_{k-1})\\)"}
        </MathJax>
        .
        <br />
        <br />
        In C17 humans were asked to compare two such segments, which we will
        refer to as <MathJax inline>{"\\(\\sigma_1\\)"}</MathJax> and{" "}
        <MathJax inline>{"\\(\\sigma_2\\)"}</MathJax>, and to simply record
        either which segment they prefer, that they have no preference, or that
        they are unable to compare the two segments. These opinions are then
        stored in a database and used to train a reward model using supervised
        learning. In particular, if we write the total reward for trajectory
        segment <MathJax inline>{"\\(\\sigma_1\\)"}</MathJax> as{" "}
        <MathJax inline>
          {"\\(R_1 = r(o_0, a_0) + r(o_1,a_1)+\\dots+r(o_{k-1}, a_{k-1})\\)"}
        </MathJax>
        , then if the user prefers sequence{" "}
        <MathJax inline>{"\\(\\sigma_1\\)"}</MathJax> to sequence{" "}
        <MathJax inline>{"\\(\\sigma_2\\)"}</MathJax>, written as{" "}
        <MathJax inline>{"\\( \\sigma_1 \\succ\\sigma_2\\)"}</MathJax>, then we
        want to have <MathJax inline>{"\\( R_1 > R_2\\)"}</MathJax>.
      </MathJaxContext>
      <br />
      <br />
      When training the reward model, under the assumption that the human's
      probability of preferring a segment depends exponentially on the value of
      the total reward for that segment, we can write human's probability of
      preferring segment one as:
      <br />
      <br />
      <MathJaxContext>
        <MathJax>
          {
            "\\(P[\\sigma^1 \\succ \\sigma^2] \\equiv P_1 =  \\frac{\\exp(R_1)}{\\exp(R_1) + \\exp(R_2)} \\)"
          }
        </MathJax>
      </MathJaxContext>
      <br />
      From this the{" "}
      <Link
        style={{ textDecoration: "underline" }}
        href="https://en.wikipedia.org/wiki/Cross-entropy"
      >
        cross-entropy
      </Link>{" "}
      loss that describes the difference between the predictions and the actual
      distribution provided by the human labels is given by:
      <br />
      <br />
      <MathJaxContext>
        <MathJax>
          {"\\(\\mathrm{loss}(r) = -(\\mu_1\\log(P_1) + \\mu_2\\log(P_2)), \\)"}
        </MathJax>
      </MathJaxContext>
      <br />
      <MathJaxContext>
        where <MathJax inline>{"\\(\\mu_1\\)"}</MathJax> and{" "}
        <MathJax inline>{"\\(\\mu_2\\)"}</MathJax> are the actual probability
        distribution over the two sequences, indicating which segment was
        preferred by the human. This can be [1, 0] if the first segment is
        preferred, [0, 1] if the second segment is preferred, or [0.5, 0.5] if
        there is no preference.
      </MathJaxContext>
      <h3 id="preferences" className="mt-5" style={{ fontSize: "20px" }}>
        Generating Preferences
      </h3>
      <br />
      One of the advantages of using the simple moving-dot environment is that
      preferences can be determined using trajectory segments that contain only
      single observation-action pairs. For any pair of segments we can also use
      a simple heuristic to determine preferences: that whichever action caused
      the dot to move closer to the center is preferred, and if the distance
      closed is the same they are ranked equally. This means that we also don't
      need to bother with actually implementing the human feedback bit just yet,
      which saves adding a significant amount of complexity to the user
      interface, and doesn't really impact our ability to learn what is going
      on.
      <br />
      <br />
      Another nice bonus from working with such a simple problem is that we
      don't even need to use the gym environment to generate the preferences
      database. In total there are five actions that we can take, the null
      action (do nothing), or moving up, down, left or right. The code for this
      subsection is in <Code p="0">make_preferences_db.py</Code>. We create a
      simple dictionary that maps the index of each action with the movement
      direction in cartesian coordinates of the pixel.
      <HighLightCode codeBlock={gen_db_1} language={"python"} />
      We can then generate a set of random positions, and actions and save these
      pairs in a list.
      <HighLightCode codeBlock={gen_db_2} language={"python"} />
      Our database of preferences can then be generated by comparing random
      pairs of segments using our heuristic described previously. Note that in
      C17 pairs of segments were chosen based on the variance of the predicted
      preferences using an ensemble of reward models. In our case we will just
      be training a single reward model and the segment pairs are just chosen
      randomly with a uniform distribution from the database.
      <HighLightCode codeBlock={gen_db_3} language={"python"} />
      Each row of the database therefore contains an index, the two segments,
      and the distribution over the preference. When training the reward model
      we will sample from this database. The code for handling the database is
      in <Code p="0">db.py</Code>, which we won't go into here but is just using
      standard SQL queries to store and retrieve the entries.
      <h3 id="reward" className="mt-5" style={{ fontSize: "20px" }}>
        Learning the Reward Model
      </h3>
      <br />
      We keep the same basic network architecture as in the previous post when
      training the mountain car reward model: A simple fully-connected network
      with a single hidden layer with Tanh activation functions. In the previous
      post we clipped the rewards post hoc to the range -1 to 1 to match the
      paper, however in this case we just added a Tanh function to the output to
      normalise the rewards for us.
      <HighLightCode codeBlock={reward_network_1} language={"python"} />
      The loss function is then mathematically identical to the previous post,
      however just needs to be generalised to accept a sequence of state-action
      pairs, rather than single ones. In addition, rather than taking the
      exponential of the sum of rewards directly, we make a simple
      re-formulation that leaves the answer unchanged but is numerically more
      stable as we are only taking an exponential of the difference between the
      sum and the mean.
      <HighLightCode codeBlock={reward_network_2} language={"python"} />
      The training loop is then unchanged from the previous post, however
      because we now have much longer segments we iterate for 1 million steps.
      In addition we include one extra feature from C17, that 10% of trajectory
      pairs have their probability distribution replaced with an even preference
      at random:
      <HighLightCode codeBlock={reward_randomisation} language={"python"} />
      Below we show a moving average of the training loss, averaged over the
      last 100 epochs. After 100000 training epochs the training loss has pretty
      much flattened out. Possibly we could train for longer to improve this
      slightly but for our purposes this is probably sufficient.
      <br />
      <br />
      <Center>
        <Image src={reward_training_loss.src} alt="reward loss" />
      </Center>
      <br />
      <br />
      <MathJaxContext>
        Below we illustrate the progress of the training by testing how well the
        reward model is able to reflect the preferences. At regular intervals we
        take the entire preference table, and split the entries into three
        groups, where segment one is preferred, segment two is preferred and
        where there is no preference. We calculate the reward for each segment
        and then histogram <MathJax inline>{"\\(R_1 - R_2\\)"}</MathJax>. If the
        reward model is working, then <MathJax inline>{"\\(R_1\\)"}</MathJax>{" "}
        should be greater than <MathJax inline>{"\\(R_2\\)"}</MathJax> when
        segment one is preferred, and so those points should all have positive
        values. Similarly when segment two is preferred those points should all
        have negative values, and when there is no preference those points
        should be clustered around zero.
      </MathJaxContext>
      <br />
      <br />
      Within relatively few iterations the network has learnt to represent the
      preferences accurately, so we can move on to training our agent.
      <Center>
        <Image src={reward_training.src} alt="reward training" />
      </Center>
      <h3 id="training" className="mt-5" style={{ fontSize: "20px" }}>
        Training the RL Agent
      </h3>
      <br />
      To train our agent to play the moving dot game we start with an
      implementation of an A2C network using PPO, which you can find{" "}
      <Link
        style={{ textDecoration: "underline" }}
        href="https://github.com/vwxyzjn/ppo-implementation-details/blob/main/ppo.py"
      >
        here
      </Link>
      . It uses a seperate network for the agent and the critic, each of which
      has the same design as in our reward model. We won't go into the details
      of this file in this post, but will simply describe how to use the reward
      network trained previously in place of the standard reward provided by the
      gym environment.
      <br />
      <br />
      Firstly we add an extra argument that the user can pass{" "}
      <Code p="0">--rlhf</Code> which will initialize the{" "}
      <Code p="0">reward_network</Code> from the file saved in the previous
      step. It then sets the network to eval mode as we won't be doing any
      updating of the weights from this point.
      <HighLightCode codeBlock={rlhf_1} language={"python"} />
      Then all we need to do is to pass the observation-action pair to the
      reward model to calculate the reward, and overwrite the original reward
      produced by the gym environment, everything else in this file remains
      exactly the same. Note that as in C17 we are clipping the reward to a
      range of +/- 1.
      <HighLightCode codeBlock={rlhf_2} language={"python"} />
      We run this process for 1000000 timesteps, with and without the additional
      RLHF parameter for 5 random initialisations each. The gym environment
      simply runs an episode for 2000 timesteps before exiting, with no
      opperunity to exit early. Below you can see a comparison of the mean
      rolling episode reward over those 5 initialisations, and the +/- 1
      standard deviation window. Given the set of possible starting points we
      would expect this average to be roughly 88.5 assuming optimal behaviour as
      measured with the original gym reward. Although both are consistent with
      that value the network trained with the original reward is really bang on
      that average line whereas the network trained with the reward model comes
      in slightly below. This is to be expected though, and indeed in the
      original RLHF the goal is simply that ideally the agent will achieve
      reward nearly as high as if it had been using the original reward
      function.
      <Center>
        <Image src={reward_loss_img.src} alt="training reward loss" />
      </Center>
      <br />
      <br />
      And thats it! We hope that you have found this post informative, we will
      be following it up with more complex examples using RLHF. In particular
      next time we will use a gym environment that requires us to train our
      reward model on segments made up of a sequence of states, rather than just
      individual ones, and will start to implement some of the additional bells
      and whistles from the full implementation. If you did find this post
      useful go ahead and follow us on{" "}
      <a
        style={{ textDecoration: "underline" }}
        href="http://www.twitter.com/dao_plays"
      >
        X
      </a>{" "}
      to keep up to date with future posts!
    </div>
  );
}

function RLHF2() {
  return <PostContent />;
}

export default RLHF2;

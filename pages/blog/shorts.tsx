import React from "react";

import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code, Text, HStack, Image } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer";
import { AiOutlineArrowRight } from "react-icons/ai";
import attributes from "../../components/blog/resources/Options/optionAttributes.png";

import { ShortsApp } from "../../components/blog/apps/shorts/App";

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
          Going Short With AMMs
        </h1>
        <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">
          May 26 2024
        </h1>
        <br />
        <br />

        <ShortsApp />
      
      </div>
    </div>
  );
}

function Shorts() {
  return <PostContent />;
}

export default Shorts;

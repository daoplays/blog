import React from "react";
import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code, Text, HStack } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer";
import { AiOutlineArrowRight } from "react-icons/ai";

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
          May 06 2024
        </h1>
        <br />
        <br />

        <br />
        <br />
        <OptionsApp />
        <br />
      </div>
    </div>
  );
}

function CoreP1() {
  return <PostContent />;
}

export default CoreP1;

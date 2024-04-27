import React from "react";
import { Tokens2022 } from "../../components/blog/apps/Token2022";
import { Code } from "@chakra-ui/react";
import { Highlight, themes } from "prism-react-renderer"

import { CoreApp } from "../../components/blog/apps/core/coreApp";

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

return (
    <div className="home" style={{ fontSize: 18 }}>
        <div className="container">
            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">
                An introduction to Metaplex Core
            </h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">May 01 2024</h1>
            <CoreApp/>
        </div>
        </div>
    );
}

function CoreP1() {
    return (
        <PostContent />
    );
}

export default CoreP1;

import { Highlight, themes } from "prism-react-renderer"
import Prism from 'prismjs';
require("prismjs/components/prism-python");


export function HighLightCode({codeBlock, language} : {codeBlock : string, language : string}) {
    return(
        <>
        <br/><br/>
        <Highlight
        prism={Prism}
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
        <br/><br/>
        </>

    );
}

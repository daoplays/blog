export const getSolscanLink = (key : string) => {
        return `https://solscan.io/account/${key}${`?cluster=devnet`}`;
};

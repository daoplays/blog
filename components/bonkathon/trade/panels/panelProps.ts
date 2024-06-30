import { MintData } from "../../../blog/apps/common";
import { AMMData } from "../../../blog/apps/shorts/state";

export interface PanelProps {
    selected?: String;
    base_data?: MintData;
    quote_data?: MintData;
    amm?: AMMData;
    user_base_balance?: number;
    user_quote_balance?: number;
    sol_amount?: number;
    token_amount?: number;
    lp_generated?: number;
    order_type?: number;
    base_output_string?: string;
    quote_output_string?: string;
    updateLiquidityLoading?: boolean;
    connected?: boolean;
    setSOLAmount?: any;
    setTokenAmount?: any;
    UpdateLiquidity?: any;
    handleConnectWallet?: any;
    placingOrder?: boolean;
    PlaceMarketOrder?: any;
}

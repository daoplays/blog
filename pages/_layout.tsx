import { PropsWithChildren, useState } from "react";
import DialectCTA from "../components/blinkbash/dialect";
import Navigation from "../components/blinkbash/Navigation";

const AppRootPage = ({ children }: PropsWithChildren) => {
    return (
        <div>
            <Navigation />
            {children}
            <DialectCTA />
        </div>
    );
};

export default AppRootPage;

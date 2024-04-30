import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";
import Footer from "../components/Footer"
import Navigation from "../components/Navigation";
import 'bootstrap/dist/css/bootstrap.css';
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

import NoSSR from "../utils/NoSSR";
function MyApp({ Component, pageProps }) {
  console.log({ theme });
  return (
    <NoSSR>
      <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss={false}
                pauseOnHover={false}
                rtl={false}
                draggable
                theme="light"
            />
      <ChakraProvider theme={theme}>
        <Navigation />
        <Component {...pageProps} />
        <Footer/>
      </ChakraProvider>
    </NoSSR>
  );
}

export default MyApp;

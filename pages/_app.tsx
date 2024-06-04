import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import "bootstrap/dist/css/bootstrap.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import "../styles/fonts.css";
import "../styles/table.css";
import NoSSR from "../utils/NoSSR";

const bonkathonLinks = [
  "/bonkathon2024",
  "/bonkathon2024/create",
  "/bonkathon2024/view",
];

import { usePathname } from "next/navigation";
import NavigationBonk from "../components/bonkathon/Navigation";
function MyApp({ Component, pageProps }) {
  const pathname = usePathname();

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
        {bonkathonLinks.includes(pathname) ? (
          <NavigationBonk />
        ) : (
          <Navigation />
        )}
        <Component {...pageProps} />
        {!bonkathonLinks.includes(pathname) && <Footer />}
      </ChakraProvider>
    </NoSSR>
  );
}

export default MyApp;

import { OneInch } from "components/protocols/1inch";
import { Shiba } from "components/protocols/Shiba";
import { createContext } from "react";
import Web3 from "web3";
import { Frax } from "./components/protocols/Frax";
import { Column } from "./styled";

const web3 = window.ethereum ? new Web3(window.ethereum) : null;

export const Web3Context = createContext(null);

function App() {
  return (
    <Web3Context.Provider value={web3}>
      <Column>
        <Frax />
        <OneInch />
        <Shiba />
      </Column>
    </Web3Context.Provider>
  );
}

export default App;

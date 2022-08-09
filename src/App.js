import Web3 from "web3";

import { OneInch } from "components/protocols/1inch";
import { IronBank } from "components/protocols/IronBank";
import { Shiba } from "components/protocols/Shiba";
import { createContext } from "react";
import { Frax } from "./components/protocols/Frax";
import { Column, Row } from "./styled";

const web3 = window.ethereum ? new Web3(window.ethereum) : null;

export const Web3Context = createContext(null);

function App() {
  return (
    <Web3Context.Provider value={web3}>
      <Row>
        <Column m="0 20px 0">
          <Frax />
          <OneInch />
          <Shiba />
        </Column>
        <Column>
          <h3>Lendings</h3>
          <IronBank />
        </Column>
      </Row>
    </Web3Context.Provider>
  );
}

export default App;

import Web3 from "web3";

import { OneInch } from "components/protocols/1inch";
import { IronBank } from "components/protocols/IronBank";
import { Shiba } from "components/protocols/Shiba";
import { createContext } from "react";
import { Frax } from "./components/protocols/Frax";
import { Column, Row } from "./styled";
import { Arrakis } from "components/protocols/arrakis";
import { Yearn } from "components/protocols/yearn";
import { Liquity } from "components/protocols/liquity";

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
          <Arrakis />
        </Column>
        <Column>
          <IronBank />
          <Yearn />
          <Liquity />
        </Column>
      </Row>
    </Web3Context.Provider>
  );
}

export default App;

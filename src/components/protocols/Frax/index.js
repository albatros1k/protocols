import { useContext, useEffect, useState } from "react";
import moment from "moment";

import { Web3Context } from "../../../App";

import fraxAbi from "abi/frax/abi.json";
import { Column } from "styled";

export const Frax = () => {
  const web3 = useContext(Web3Context);
  const [frax, setFrax] = useState(null);

  const walletAddress = "0x67e218a6d51ee4ae365199e35fe9cae005d40da2";
  const veFXS = "0xc8418aF6358FFddA74e09Ca9CC3Fe03Ca6aDC5b0";

  const getInfo = async () => {
    const fraxInstance = new web3.eth.Contract(fraxAbi, veFXS);
    const decimals = await fraxInstance.methods.decimals().call();
    const locked = await fraxInstance.methods.locked(walletAddress).call();
    const symbol = await fraxInstance.methods.symbol().call();

    const { end, amount } = locked || {};

    const date = moment.unix(end).format("YYYY/MM/DD HH:mm");
    const balance = amount / Math.pow(10, +decimals);

    setFrax({ symbol, date, balance });
  };

  useEffect(() => {
    getInfo();
  }, []);

  if (!frax) return <>Loading...</>;
  else {
    const { symbol, date, balance } = frax;
    return (
      <Column m="0 0 20px">
        <h2>FRAX</h2>
        <h3>Locked</h3>
        <div>Pool: {symbol}</div>{" "}
        <div>
          Balance {balance.toFixed(2)} {symbol}
        </div>
        <div>Rewards:</div>
        <div>Unlock time: {date}</div>
      </Column>
    );
  }
};

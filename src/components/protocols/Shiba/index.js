import { useContext, useEffect, useState } from "react";

import { Web3Context } from "../../../App";

import stakedABI from "abi/shiba/staked.json";
import shibABI from "abi/shiba/shibABI.json";

import { Column } from "styled";

export const Shiba = () => {
  const web3 = useContext(Web3Context);
  const [shiba, setShiba] = useState(null);

  const walletAddress = "0x95a9bd206ae52c4ba8eecfc93d18eacdd41c88cc";
  const xShibStaked = "0xB4a81261b16b92af0B9F7C4a83f1E885132D81e4";
  const shibAddress = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";

  useEffect(() => {
    const getInfo = async () => {
      const stakedInstance = new web3.eth.Contract(stakedABI, xShibStaked);
      const tokenInstance = new web3.eth.Contract(shibABI, shibAddress);

      const poolName = await tokenInstance.methods.symbol().call();
      const symbol = await stakedInstance.methods.symbol().call();
      const decimals = await stakedInstance.methods.decimals().call();
      const balance = await stakedInstance.methods.balanceOf(walletAddress).call();

      const cryptoBalance = balance / Math.pow(10, +decimals);

      setShiba({ balance: cryptoBalance, symbol, poolName });
    };
    getInfo();
  }, [web3.eth.Contract]);

  if (!shiba) return <>Loading...</>;
  else {
    const { balance, symbol, poolName } = shiba;
    return (
      <Column>
        <h2>SHIBA</h2>
        <h3>Staked</h3>
        <div>Pool: {poolName}</div>
        <div>
          Balance: {balance.toFixed(2)} {symbol}
        </div>
        {/* <div>USD Value: {(balance * fiatPrice).toFixed(2)}</div> */}
      </Column>
    );
  }
};

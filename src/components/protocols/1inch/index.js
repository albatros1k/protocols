import { useContext, useEffect, useState } from "react";

import { Web3Context } from "../../../App";

import inchABI from "abi/1inch/liquidityPoolABI.json";
import internalABI from "abi/1inch/inchABI.json";
import oracleABI from "abi/1inch/oracleABI.json";
import lpABI from "abi/1inch/lpABI.json";
import { Column } from "styled";

export const OneInch = () => {
  const web3 = useContext(Web3Context);
  const [inch, setInch] = useState(null);

  const walletAddress = "0x4ab53faafbdeafd85923e29c9423efd094880a1d";
  const factoryContract = "0xbAF9A5d4b0052359326A6CDAb54BABAa3a3A9643";
  const inchTokenAddress = "0x111111111117dC0aa78b770fA6A738034120C302";
  const oracleContract = "0x07D91f5fb9Bf7798734C3f606dB065549F6893bb";

  const usdcTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const getLiquidityPool = async () => {
    const inchInstance = new web3.eth.Contract(inchABI, factoryContract);
    const pools = await inchInstance.methods.getAllPools().call();
    // console.log(pools);

    await Promise.all(
      pools.map(async (lpAddress) => {
        const lpContract = new web3.eth.Contract(lpABI, lpAddress);
        const symbol = await lpContract.methods.symbol().call();
        const balance = await lpContract.methods.balanceOf(walletAddress).call();
        // console.log(`${symbol} ${balance} ${lpAddress}`);
      })
    );
  };

  getLiquidityPool();

  useEffect(() => {
    const getInfo = async () => {
      const inchInstance = new web3.eth.Contract(inchABI, factoryContract);
      const inchController = new web3.eth.Contract(internalABI, inchTokenAddress);
      const oracleController = new web3.eth.Contract(oracleABI, oracleContract);

      const symbol = await inchController.methods.symbol().call();
      const decimals = await inchController.methods.decimals().call();
      const balance = await inchInstance.methods.balanceOf(walletAddress).call();
      const usdcExchangeRate = await oracleController.methods.getRate(inchTokenAddress, usdcTokenAddress, false).call();

      const cryptoBalance = balance / Math.pow(10, +decimals);
      const fiatPrice = usdcExchangeRate / Math.pow(10, 6);

      setInch({ balance: cryptoBalance, symbol, fiatPrice });
    };
    getInfo();
  }, [web3.eth.Contract]);

  if (!inch) return <>Loading...</>;
  else {
    const { balance, symbol, fiatPrice } = inch;
    return (
      <Column>
        <h2>1INCH</h2>
        <h3>Governance</h3>
        <div>Pool: {symbol}</div>
        <div>
          Balance: {balance.toFixed(2)} {symbol}
        </div>
        <div>USD Value: {(balance * fiatPrice).toFixed(2)}</div>
      </Column>
    );
  }
};

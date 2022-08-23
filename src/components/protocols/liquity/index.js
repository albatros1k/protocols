import { Web3Context } from "App";
import React, { useState } from "react";
import { useContext } from "react";

import { Column, Row } from "styled";
import { useEffect } from "react";

import troveABI from "abi/liquity/troveABI.json";
import stakedABI from "abi/liquity/stakedABI.json";
import stabilityABI from "abi/liquity/stabilityABI.json";

export const Liquity = () => {
  const web3 = useContext(Web3Context);

  const [lending, setLending] = useState(null);
  const [staked, setStaked] = useState(null);
  const [farming, setFarming] = useState(null);

  const walletAddress = "0x593c427d8c7bf5c555ed41cd7cb7cce8c9f15bb5";

  // For lending module there always will be only ETH supplied, and LUSD borrowed
  const getLendingModule = async () => {
    //Trove manager provides supplied and borrowed positions
    const troveManager = new web3.eth.Contract(troveABI, "0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2");

    const supplied = [];
    const borrowed = [];

    const { debt, coll } = await troveManager.methods.getEntireDebtAndColl(walletAddress).call();

    await Promise.all(
      ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0"].map((address) =>
        fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`)
      )
    )
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then(
        ([
          {
            market_data: {
              current_price: { usd: price0 },
            },
          },
          {
            market_data: {
              current_price: { usd: price1 },
            },
          },
        ]) => {
          supplied.push({ symbol: "ETH", amount: +web3.utils.fromWei(coll, "ether"), price: price0 });
          borrowed.push({ symbol: "LUSD", amount: +web3.utils.fromWei(debt, "ether"), price: price1 });
        }
      )
      .then(() => setLending({ supplied, borrowed }));
  };

  const getStakedModule = async () => {
    const stakedLqty = new web3.eth.Contract(stakedABI, "0x4f9Fbb3f1E99B56e0Fe2892e623Ed36A76Fc605d");
    const stakedAmount = await stakedLqty.methods.stakes(walletAddress).call();
    const lqtyToken = await stakedLqty.methods.lqtyToken().call();

    const ethReward = await stakedLqty.methods.getPendingETHGain(walletAddress).call();
    const lusdReward = await stakedLqty.methods.getPendingLUSDGain(walletAddress).call();

    const price = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${lqtyToken}`)
      .then((price) => price.json())
      .then(
        ({
          market_data: {
            current_price: { usd },
          },
        }) => usd
      );

    setStaked({
      symbol: "LQTY",
      amount: +web3.utils.fromWei(stakedAmount, "ether"),
      price,
      ethReward: +web3.utils.fromWei(ethReward, "ether"),
      lusdReward: +web3.utils.fromWei(lusdReward, "ether"),
    });
  };

  const getFarmingModule = async () => {
    const stabilityPool = new web3.eth.Contract(stabilityABI, "0x66017D22b0f8556afDd19FC67041899Eb65a21bb");
    const lusdDeposit = await stabilityPool.methods.getCompoundedLUSDDeposit(walletAddress).call();
    const lusdToken = await stabilityPool.methods.lusdToken().call();

    const ethReward = await stabilityPool.methods.getDepositorETHGain(walletAddress).call();
    const lqtyReward = await stabilityPool.methods.getDepositorLQTYGain(walletAddress).call();

    const price = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${lusdToken}`)
      .then((price) => price.json())
      .then(
        ({
          market_data: {
            current_price: { usd },
          },
        }) => usd
      );
    setFarming({
      symbol: "LUSD",
      amount: +web3.utils.fromWei(lusdDeposit, "ether"),
      price,
      ethReward: +web3.utils.fromWei(ethReward, "ether"),
      lqtyReward: +web3.utils.fromWei(lqtyReward, "ether"),
    });
  };

  useEffect(() => {
    getLendingModule();
    getStakedModule();
    getFarmingModule();
  }, []);

  if (!lending || !staked || !farming) return <div>Loading...</div>;
  else {
    const { supplied, borrowed } = lending;

    const total =
      farming.amount * farming.price +
      staked.amount * staked.price +
      supplied.reduce((acc, { amount, price }) => (acc += amount * price), 0) -
      borrowed.reduce((acc, { amount, price }) => (acc += amount * price), 0);

    return (
      <Column m="0 0 20px">
        <h2>Liquity</h2>
        <h3>
          Total:
          {total.toFixed(2)}
        </h3>
        <h4>Lending</h4>
        <h5>Supply</h5>
        {supplied.map(({ symbol, amount, price }) => (
          <Row m="0 0 5px" key={symbol + amount}>
            <p style={{ marginRight: 5 }}>{symbol}</p>
            <p style={{ marginRight: 5 }}>
              {amount.toFixed(2)} {symbol}
            </p>
            <p>${(amount * price).toFixed(2)}</p>
          </Row>
        ))}
        <h5>Borrow</h5>
        {borrowed.map(({ symbol, amount, price }) => (
          <Row m="0 0 5px" key={symbol + amount}>
            <p style={{ marginRight: 5 }}>{symbol}</p>
            <p style={{ marginRight: 5 }}>
              {amount.toFixed(2)} {symbol}
            </p>
            <p>${(amount * price).toFixed(2)}</p>
          </Row>
        ))}
        <h4>Staked</h4>
        <Row m="0 0 5px">
          <p style={{ marginRight: 10 }}>{`Pool: ${staked.symbol}`}</p>
          <p style={{ marginRight: 10 }}>Balance: {`${staked.amount.toFixed(2)} ${staked.symbol}`}</p>
          <p style={{ marginRight: 10 }}>
            Rewards: {staked.ethReward.toFixed(2)} ETH <br />
            {staked.lusdReward.toFixed(2)} LUSD
          </p>
          <p>USD Value: ${(staked.amount * staked.price).toFixed(2)}</p>
        </Row>
        <h4>Farming</h4>
        <Row m="0 0 5px">
          <p style={{ marginRight: 10 }}>{`Pool: ${farming.symbol}`}</p>
          <p style={{ marginRight: 10 }}>Balance: {`${farming.amount.toFixed(2)} ${farming.symbol}`}</p>
          <p style={{ marginRight: 10 }}>
            Rewards: {farming.ethReward.toFixed(2)} ETH <br />
            {farming.lqtyReward.toFixed(2)} LQTY
          </p>
          <p>USD Value: ${(farming.amount * farming.price).toFixed(2)}</p>
        </Row>
      </Column>
    );
  }
};

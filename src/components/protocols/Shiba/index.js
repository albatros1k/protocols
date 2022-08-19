import { useContext, useEffect, useState } from "react";
import moment from "moment";

import { Web3Context } from "../../../App";

import stakedABI from "abi/shiba/stakedABI.json";
import swapABI from "abi/shiba/swapABI.json";
import internalTokenABI from "abi/shiba/internalTokenABI.json";
import woofABI from "abi/shiba/woofABI.json";
import boneLockerABI from "abi/shiba/boneLockerABI.json";

import { Column } from "styled";
import { internalAddresses, stakedAddresses } from "./addresses";

export const Shiba = () => {
  const web3 = useContext(Web3Context);
  const [staked, setStaked] = useState(null);
  const [farming, setFraming] = useState(null);
  const [locked, setLocked] = useState(null);

  const wallet = "0x96ebc6b1620b7431f90a48c445d89e4939c2a155";

  const getStakedModule = async () => {
    await Promise.all(
      stakedAddresses.map(async (stakedAddress, index) => {
        const internalAddress = internalAddresses[index];
        const stakedInstance = new web3.eth.Contract(stakedABI, stakedAddress);
        const internalInstance = new web3.eth.Contract(internalTokenABI, internalAddress);
        const usersShare = await stakedInstance.methods.balanceOf(wallet).call();
        const totalTokenLocked = await internalInstance.methods.balanceOf(stakedAddress).call();
        const xTokenTotalSupply = await stakedInstance.methods.totalSupply().call();
        const stakedBalance = (usersShare * totalTokenLocked) / xTokenTotalSupply / Math.pow(10, 18);
        const xSymbol = await stakedInstance.methods.symbol().call();
        const poolName = await internalInstance.methods.symbol().call();

        return { symbol: xSymbol, poolName, balance: stakedBalance };
      })
    ).then((staked) => setStaked(staked));
  };

  const getFactoryModule = async () => {
    const woofPoolIntance = new web3.eth.Contract(woofABI, "0x94235659cF8b805B2c658f9ea2D6d6DDbb17C8d7");
    const poolLength = await woofPoolIntance.methods.poolLength().call();

    const farmingPools = [];

    for (let i = 0; i < poolLength; i++) {
      const { lpToken } = await woofPoolIntance.methods.poolInfo(i).call();
      const swapInstance = new web3.eth.Contract(swapABI, lpToken);

      const token0 = await swapInstance.methods.token0().call();
      const token1 = await swapInstance.methods.token1().call();

      const token0Contract = new web3.eth.Contract(internalTokenABI, token0);
      const token1Contract = new web3.eth.Contract(internalTokenABI, token1);

      const { amount } = await woofPoolIntance.methods.userInfo(i, wallet).call();

      if (+amount > 0) {
        const totalSupply = await swapInstance.methods.totalSupply().call();

        const { _reserve0, _reserve1 } = await swapInstance.methods.getReserves().call();
        const balance0 = ((amount / totalSupply) * _reserve0) / Math.pow(10, 18);
        const balance1 = ((amount / totalSupply) * _reserve1) / Math.pow(10, 18);

        const symbol0 = await token0Contract.methods.symbol().call();
        const symbol1 = await token1Contract.methods.symbol().call();

        const rewards = (await woofPoolIntance.methods.pendingBone(i, wallet).call()) / Math.pow(10, 18);

        farmingPools.push({ symbol0, symbol1, balance0, balance1, rewards });
      }
    }
    setFraming(farmingPools);
  };

  const getLockedModule = async () => {
    const boneLocker = new web3.eth.Contract(boneLockerABI, "0xa404F66B9278c4aB8428225014266B4B239bcdc7");
    const latestCounterByUser = await boneLocker.methods.latestCounterByUser(wallet).call();
    const { _timestamp } = await boneLocker.methods.lockInfoByUser(wallet, latestCounterByUser).call();
    const lockingPeriod = await boneLocker.methods.lockingPeriod().call();

    const unlockTime = +_timestamp + +lockingPeriod;
    const lockAmount = (await boneLocker.methods.unclaimedTokensByUser(wallet).call()) / Math.pow(10, 18);
    setLocked({ lockAmount, unlockTime });
  };

  useEffect(() => {
    getStakedModule();
    getFactoryModule();
    getLockedModule();
  }, []);

  if (!staked || !farming || !locked) return <>Loading...</>;
  else {
    return (
      <Column m="20px 0 0">
        <h2>SHIBA</h2>
        <h3>Staked</h3>
        {[...staked]
          .sort((a, b) => b.balance - a.balance)
          .map(({ symbol, poolName, balance }) => (
            <div key={poolName} style={{ display: "flex" }}>
              <p style={{ marginRight: 10 }}>{symbol}</p>
              <p style={{ marginRight: 10 }}>{poolName}</p>
              <p>
                {balance.toFixed(2)} {poolName}
              </p>
            </div>
          ))}
        <h3>Farming</h3>
        {[...farming].map(({ symbol0, symbol1, balance0, balance1, rewards }) => {
          return (
            <div key={symbol0 + symbol1}>
              <p style={{ marginRight: 10 }}>
                Pool: {symbol0} + {symbol1}
              </p>
              <p style={{ marginRight: 10 }}>Balance: {`${balance0.toFixed(2)} ${symbol0} ${balance1.toFixed(2)} ${symbol1}`}</p>
              <p style={{ marginRight: 10 }}>Rewards: {rewards.toFixed(2)} BONE</p>
            </div>
          );
        })}
        <h3>Locked</h3>
        <div>
          <p style={{ marginRight: 10 }}>Pool: Bone</p>
          <p style={{ marginRight: 10 }}> Balance: {locked.lockAmount?.toFixed(2)} BONE</p>
          <p style={{ marginRight: 10 }}>Unlock Time: {moment.unix(locked?.unlockTime).format("YYYY/MM/DD HH:mm")}</p>
        </div>
      </Column>
    );
  }
};

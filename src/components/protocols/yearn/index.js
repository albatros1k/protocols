import { Web3Context } from "App";
import React, { useState } from "react";
import { useContext } from "react";

import { Column, Row } from "styled";
import { useEffect } from "react";

import registryABI from "abi/yearn/registryABI.json";
import vaultABI from "abi/yearn/vaultABI.json";

export const Yearn = () => {
  const web3 = useContext(Web3Context);
  const [yieldModule, setYieldModule] = useState(null);

  const walletAddress = "0xb51b1a85c3b142dc7f0a1c8f4f1c22b137ced74b";

  useEffect(() => {
    const getYieldModule = async () => {
      const registryAdapter = new web3.eth.Contract(registryABI, "0x240315db938d44bb124ae619f5Fd0269A02d1271"); //registry (factory)
      const vaults = await registryAdapter.methods.assetsAddresses().call();
      // console.log(vaults, "va");
      Promise.all(
        vaults.map(async (address) => {
          const vaultInstance = new web3.eth.Contract(vaultABI, address);
          const balance = await vaultInstance.methods.balanceOf(walletAddress).call();
          const symbol = await vaultInstance.methods.symbol().call();
          // console.log(`${symbol}-${balance} ${address}`);
        })
      );
    };
    getYieldModule();
  }, []);

  if (!yieldModule) return <div>Loading...</div>;
  return (
    <Column m="0 0 20px">
      <h2>Yearn</h2>
    </Column>
  );
};

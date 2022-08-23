import { Web3Context } from "App";
import React, { useState } from "react";
import { useContext } from "react";

import { Column, Row } from "styled";
import { useEffect } from "react";

import troveABI from "abi/liquity/troveABI.json";

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
    // const troves = await troveManager.methods.getEntireDebtAndColl(walletAddress).call();
    // console.log(troves);

    // const { debt, call } = await troveManager.methods.getEntireDebtAndColl(walletAddress).call();
    // console.log(debt, call, "debt,call");
  };

  getLendingModule();

  useEffect(() => {}, []);

  if (!lending) return <div>Loading...</div>;
  return (
    <Column m="0 0 20px">
      <h2>Liquity</h2>
    </Column>
  );
};

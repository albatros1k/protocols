import { Web3Context } from "App";
import { useContext, useEffect, useState } from "react";
import { Column, Row } from "styled";

import abi from "abi/ironBank/ironBankABI.json";
import oracleAbi from "abi/ironBank/oracleABI.json";
import { activeMarkets, fixedForexMarkets, suspendedMarkets } from "./addresess";

export const IronBank = () => {
  const web3 = useContext(Web3Context);

  const [borrow, setBorrow] = useState(null);
  const [supply, setSupply] = useState(null);

  const walletAddress = "0x38abab9766e0b27d2912718a884292b8e7eb2803";

  const oracleContract = "0xE4e9F6cfe8aC8C75A3dBeF809dbe4fc40e6FDc4b";

  useEffect(() => {
    const allItokens = [...activeMarkets, ...fixedForexMarkets, ...suspendedMarkets];

    const getData = async () => {
      const borrowed = [];
      const supplied = [];

      allItokens.forEach(async (address, index, { length }) => {
        const isLast = length - index === 1;

        const contractInstance = new web3.eth.Contract(abi, address);
        const oracleInstance = new web3.eth.Contract(oracleAbi, oracleContract);

        const mentisa = Math.pow(10, 18);

        const symbol = await contractInstance.methods.symbol().call();
        const borrowedBalance = await contractInstance.methods.borrowBalanceStored(walletAddress).call();
        const borrowAmount = borrowedBalance / mentisa;
        const exchangeRate = await oracleInstance.methods.getUnderlyingPrice(address).call();
        const price = symbol.includes("USDC") ? 1 : exchangeRate / mentisa;

        const tokens = await contractInstance.methods.balanceOfUnderlying(walletAddress).call();
        const underlyingAddress = await contractInstance.methods.underlying().call();

        const underlyingContract = new web3.eth.Contract(
          [{ inputs: [], name: "decimals", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], stateMutability: "view", type: "function" }],
          underlyingAddress
        );
        const underlyingDecimals = await underlyingContract.methods.decimals().call();

        const supplyAmount = tokens / Math.pow(10, underlyingDecimals);

        if (supplyAmount) {
          supplied.push({ symbol, supplyAmount, price });
        }

        if (borrowAmount) {
          borrowed.push({ symbol, borrowAmount, price });
        }
        if (isLast) {
          setSupply(supplied);
          setBorrow(borrowed);
        }
      });
    };
    getData();
  }, [web3.eth.Contract]);

  if (!borrow || !supply) return <>Loading...</>;
  return (
    <Column m="0 0 20px">
      <h2>Iron Bank</h2>
      <h3>
        Total:{" "}
        {(
          supply.reduce((acc, { supplyAmount, price }) => (acc += supplyAmount * price), 0) -
          borrow.reduce((acc, { borrowAmount, price }) => (acc += borrowAmount * price), 0)
        ).toFixed(2)}
      </h3>
      <h4>Supply</h4>
      {supply.map(({ symbol, supplyAmount, price }) => (
        <Row m="0 0 5px" key={symbol + supplyAmount}>
          <p style={{ marginRight: 10 }}>{symbol}</p>
          <p style={{ marginRight: 10 }}>
            {supplyAmount.toFixed(2)} {symbol}
          </p>
          <p>${(supplyAmount * price).toFixed(2)}</p>
        </Row>
      ))}
      <h4>Borrow</h4>
      {borrow.map(({ symbol, borrowAmount, price }) => (
        <Row m="0 0 5px" key={symbol + borrowAmount}>
          <p style={{ marginRight: 10 }}>{symbol}</p>
          <p style={{ marginRight: 10 }}>
            {borrowAmount.toFixed(2)} {symbol}
          </p>
          <p>${(borrowAmount * price).toFixed(2)}</p>
        </Row>
      ))}
    </Column>
  );
};

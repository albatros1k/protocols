import { Web3Context } from "App";
import React, { useState } from "react";
import { useContext } from "react";

import factoryABI from "abi/arrakis/factoryABI.json";

import tokenABI from "abi/arrakis/tokenABI.json";
import vaultABI from "abi/arrakis/vaultABI.json";
import { Column, Row } from "styled";
import { useEffect } from "react";

export const Arrakis = () => {
  const web3 = useContext(Web3Context);
  const [liquidity, setLiquidity] = useState(null);

  const walletAddress = "0xac5406aebe35a27691d62bfb80eefcd7c0093164";

  const getData = async () => {
    const factoryInstance = new web3.eth.Contract(factoryABI, "0xEA1aFf9dbFfD1580F6b81A3ad3589E66652dB7D9"); //Arrakis Factory
    const deployers = await factoryInstance.methods.getDeployers().call();

    const poolData = [];

    await Promise.all(
      deployers.map(async (deployer) => {
        const deployerPools = await factoryInstance.methods.getPools(deployer).call();
        return deployerPools;
      })
    ).then(async (res) => {
      const uniquePools = [...new Set(res.flat())];
      await Promise.all(
        uniquePools.map(async (pool) => {
          const poolInstance = new web3.eth.Contract(vaultABI, pool);

          const lpBalance = await poolInstance.methods.balanceOf(walletAddress).call();

          if (lpBalance > 0) {
            const token0 = await poolInstance.methods.token0().call();
            const token1 = await poolInstance.methods.token1().call();

            const token0Instance = new web3.eth.Contract(tokenABI, token0);
            const token1Instance = new web3.eth.Contract(tokenABI, token1);

            const symbol0 = await token0Instance.methods.symbol().call();
            const symbol1 = await token1Instance.methods.symbol().call();

            const totalSupply = await poolInstance.methods.totalSupply().call();
            const { amount0Current, amount1Current } = await poolInstance.methods.getUnderlyingBalances().call();
            const token0Balance = ((lpBalance / totalSupply) * amount0Current) / Math.pow(10, 18);
            const token1Balance = ((lpBalance / totalSupply) * amount1Current) / Math.pow(10, 18);

            await Promise.all([token0, token1].map((address) => fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`)))
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
                ]) => poolData.push({ symbol0, symbol1, token0Balance, token1Balance, price0, price1, total: token0Balance * price0 + token1Balance * price1 })
              );
          }
        })
      ).then(() => setLiquidity(poolData));
    });
  };

  useEffect(() => {
    getData();
  }, []);

  if (!liquidity) return <div>Loading...</div>;
  return (
    <Column m="0 0 20px">
      <h2>Arrakis</h2>
      <h3>Total: ${liquidity.reduce((acc, { total }) => (acc += total), 0).toFixed(2)} </h3>
      <h4>Liquidity pool</h4>

      {[...liquidity]
        .sort((a, b) => b.total - a.total)
        .map(({ symbol0, symbol1, token0Balance, token1Balance, price0, price1, total }) => {
          return (
            <Row m="0 0 5px" key={symbol0 + symbol1}>
              <p style={{ marginRight: 10 }}>{`Pool: ${symbol0} + ${symbol1}`}</p>
              <p style={{ marginRight: 10 }}>Balance: {`${token0Balance.toFixed(2)} ${symbol0} ${token1Balance.toFixed(2)} ${symbol1}`}</p>
              <p>USD Value: ${total.toFixed(2)}</p>
            </Row>
          );
        })}
    </Column>
  );
};

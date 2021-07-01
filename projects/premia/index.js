const sdk = require("@defillama/sdk");
const abi = require("./abi.json");

const PREMIA_OPTIONS_CONTRACT_ETH =
  "0x5920cb60B1c62dC69467bf7c6EDFcFb3f98548c0";
const PREMIA_OPTIONS_CONTRACT_BSC =
  "0x8172aAC30046F74907a6b77ff7fC867A6aD214e4";

const erc20DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const erc20BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56";

const calcTvl = async (balances, chain, block, premiaOptionsContract) => {
  const erc20TokensLength = (
    await sdk.api.abi.call({
      abi: abi.tokensLength,
      target: premiaOptionsContract,
      block,
      ...(chain == "bsc" && { chain }),
    })
  ).output;

  for (let i = 0; i < erc20TokensLength; i++) {
    const erc20Tokens = (
      await sdk.api.abi.call({
        abi: abi.tokens,
        target: premiaOptionsContract,
        params: i,
        block,
        ...(chain == "bsc" && { chain }),
      })
    ).output;

    const erc20TokensBalance = (
      await sdk.api.erc20.balanceOf({
        target: erc20Tokens,
        owner: premiaOptionsContract,
        block,
        ...(chain == "bsc" && { chain }),
      })
    ).output;

    if (chain == "ethereum") {
      sdk.util.sumSingleBalance(balances, `${erc20Tokens}`, erc20TokensBalance);
    } else {
      sdk.util.sumSingleBalance(
        balances,
        `bsc:${erc20Tokens}`,
        erc20TokensBalance
      );
    }
  }
};

const ethTvl = async (timestamp, ethBlock, chainBlocks) => {
  const balances = {};

  await calcTvl(balances, "ethereum", ethBlock, PREMIA_OPTIONS_CONTRACT_ETH);

  const erc20DAIBalance = (
    await sdk.api.erc20.balanceOf({
      target: erc20DAI,
      owner: PREMIA_OPTIONS_CONTRACT_ETH,
      ethBlock,
    })
  ).output;

  sdk.util.sumSingleBalance(balances, erc20DAI, erc20DAIBalance);

  return balances;
};

const bscTvl = async (timestamp, ethBlock, chainBlocks) => {
  const balances = {};

  await calcTvl(
    balances,
    "bsc",
    chainBlocks["bsc"],
    PREMIA_OPTIONS_CONTRACT_BSC
  );

  const erc20BUSDBalance = (
    await sdk.api.erc20.balanceOf({
      target: erc20BUSD,
      owner: PREMIA_OPTIONS_CONTRACT_BSC,
      block: chainBlocks["bsc"],
      chain: "bsc",
    })
  ).output;

  sdk.util.sumSingleBalance(balances, `bsc:${erc20BUSD}`, erc20BUSDBalance);

  return balances;
};

module.exports = {
  ethereum: {
    tvl: ethTvl,
  },
  bsc: {
    tvl: bscTvl,
  },
  tvl: sdk.util.sumChainTvls([ethTvl, bscTvl]),
};

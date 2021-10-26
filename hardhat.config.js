require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

const { ftmscanApiKey, privateKey } = require("./secrets.json");

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      outputSelection: {
        "*": {
          "*": ["storageLayout"]
        }
      }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: "https://rpc.ftm.tools"
      }
    },
    testnet: {
      url: "https://rpc.testnet.fantom.network/",
      accounts: [privateKey]
    },
    mainnet: {
      url: "https://rpc.ftm.tools",
      accounts: [privateKey],
      timeout: 120_000
    }
  },
  etherscan: {
    apiKey: ftmscanApiKey
  },
  gasReporter: {
    excludeContracts: 
      ["rarity.sol", 
      "rarity_xp_proxy",
      "theRarityForest.sol", 
      "theRarityForestV2.sol", 
      "TheRarityForestV3",
      "codex_base_random_mockable.sol",
      "codex_skills.sol",
      "rarity_attributes.sol",
      "rarity_skills.sol",
      "ERC721.sol"]
  }
};

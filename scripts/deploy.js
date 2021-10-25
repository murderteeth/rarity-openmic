const axios = require("axios");
const abiCoder = require("web3-eth-abi");
const { ftmscanApiKey } = require("../secrets.json");

async function getV1Prizes() {
  const response = await axios.get(
    "https://api.ftmscan.com/api", 
    { params: {
        module: "logs",
        action: "getLogs",
        topic0: "0x5e8e3a0d0f80336a03cceec8e0fde04e31e184571cb69c996509abe173091b46",
        apikey: ftmscanApiKey
    }}
  );

  const results = response.data.result.map(result => {
    return abiCoder.decodeParameters(
      [{name: 'summoner', type: 'uint256'}, {name: 'tokenId', type: 'uint256'}]
      , result.data.slice(2));
  });

  return Array.from(new Set(results.map(prize => parseInt(prize.tokenId)))).sort((a, b) => a - b);
}

async function main() {
  await hre.run("clean");
  await hre.run("compile");

  const rarity = "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb";
  const attributes = "0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1";
  const skills = "0x51C0B29A1d84611373BA301706c6B4b72283C80F";
  const random = "0x7426dBE5207C2b5DaC57d8e55F0959fcD99661D4";
  const theRarityForestV3 = "0x48e6F88F1Ab05677675dE9d14a705f8A137ea2bC";
  const openMicV1 = "0x46Fe9AAd56f486950ed3732A91552e3919e5713F";

  const gasMeter = [];

  const rarityOpenMicV2 = await (await ethers.getContractFactory("RarityOpenMicV2")).deploy(
    rarity, attributes, skills, random, theRarityForestV3, openMicV1);
  await rarityOpenMicV2.deployed();
  console.log("🚀 deployed to", rarityOpenMicV2.address);

  const v1Prizes = await getV1Prizes();
  console.log("⚙️  reminting", v1Prizes.length, "prizes...");
  const lotSize = 10;
  for(let i = 0; i < v1Prizes.length; i += lotSize) {
    const lot = v1Prizes.slice(i, i + lotSize);
    const fromTokenId = lot[0];
    const toTokenid = lot[lot.length - 1];
    console.log("⚙️  remint", fromTokenId, "-", toTokenid);
    const reminttx = await(await rarityOpenMicV2.remintV1Prizes(fromTokenId, toTokenid, { gasLimit: 2_500_000 })).wait();
    console.log("⛽️ gas", reminttx.gasUsed.toString());
    gasMeter.push(reminttx.gasUsed);
  }
  console.log("🎉 remint complete");

  const totalGasCost = gasMeter.reduce((a, v) => a.add(v));
  console.log("⛽️ gas total", totalGasCost.toString());

  if(hre.network.name === "mainnet") {
    await hre.run("verify:verify", {
      address: rarityOpenMicV2.address,
      constructorArguments: [rarity, attributes, skills, random, theRarityForestV3, openMicV1],
    });
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
async function main() {
  await hre.run("clean");
  await hre.run("compile");

  const rarity = "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb";
  const attributes = "0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1";
  const skills = "0x51C0B29A1d84611373BA301706c6B4b72283C80F";
  const random = "0x7426dBE5207C2b5DaC57d8e55F0959fcD99661D4";
  const theRarityForestV2 = "0x9e894cd5dCC5Bad1eD3663077871d9D010f654b5";

  const rarityOpenMic = await (await ethers.getContractFactory("RarityOpenMic")).deploy(
    rarity, attributes, skills, random, theRarityForestV2);
  await rarityOpenMic.deployed();
  console.log("Deployed to:", rarityOpenMic.address);

  await hre.run("verify:verify", {
    address: rarityOpenMic.address,
    constructorArguments: [rarity, attributes, skills, random, theRarityForestV2],
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const { smock } = require("@defi-wonderland/smock");
const { classes } = require("../rarityjs/classes");
const { skills } = require("../rarityjs/skills");

async function main() {
  await hre.run("clean");
  await hre.run("compile");

  rarity = {
    core: await (await smock.mock("contracts/rarity/rarity.sol:rarity")).deploy(),
    attributes: await (await smock.mock("contracts/rarity/rarity_attributes.sol:rarity_attributes")).deploy(),
    skills: await (await smock.mock("contracts/rarity/rarity_skills.sol:rarity_skills")).deploy(),
    skillsCodex: await (await smock.mock("contracts/rarity/codex_skills.sol:codex")).deploy(),
    random: await (await smock.mock("contracts/rarity/codex_base_random_mockable.sol:codex")).deploy()
  }

  await rarity.core.setVariable("next_summoner", 1);  //init at 1 so we don't mint to summoner zero (which breaks ERC721)
  await rarity.attributes.setVariable("rm", rarity.core.address);
  await rarity.skills.setVariable("rm", rarity.core.address);
  await rarity.skills.setVariable("_attr", rarity.attributes.address);
  await rarity.skills.setVariable("_codex_skills", rarity.skillsCodex.address);

  theRarityForest = await (await ethers.getContractFactory("TheRarityForest")).deploy(
    rarity.core.address);
  theRarityForestV2 = await (await ethers.getContractFactory("TheRarityForestV2")).deploy(
    rarity.core.address, 
    theRarityForest.address);
  await theRarityForestV2.deployed();

  rarityOpenMic = await (await ethers.getContractFactory("RarityOpenMic")).deploy(
    rarity.core.address,
    rarity.attributes.address,
    rarity.skills.address,
    rarity.random.address,
    theRarityForestV2.address);
  await rarityOpenMic.deployed();

  const summoner = (await rarity.core.next_summoner()).toNumber();
  await rarity.core.summon(classes.bard);
  console.log("summoner", summoner);
  await rarity.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
  await rarity.core.setVariable("level", { [summoner]: 2 });

  const skillPoints = Array(36).fill(0);
  skillPoints[skills.perform] = 5;
  await rarity.skills.set_skills(summoner, skillPoints);

  for(let i = 0; i < 100; i++) {
    const performance = await(await rarityOpenMic.perform(summoner)).wait();
    const { check, success, crit } = performance.events[0].args;
    const prizes = await rarityOpenMic.getPrizes(summoner);
    console.log(
      i, "results ::", 
      "check", check.toNumber(), 
      "success", success, 
      "crit", crit,
      "door prizes", prizes.filter(p => !p.rare).length,
      "rare prizes", prizes.filter(p => p.rare).length);
    await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
  }

  const doorPrizes = (await rarityOpenMic.getDoorPrizes())
    .reduce((acc, key) => ({...acc, [key]: false}), {});
  const rarePrizes = (await rarityOpenMic.getRarePrizes())
    .reduce((acc, key) => ({...acc, [key]: false}), {});

  const prizes = await rarityOpenMic.getPrizes(summoner);
  prizes.forEach(prize => {
    if(prize.rare) {
      rarePrizes[prize.name] = true;
    } else {
      doorPrizes[prize.name] = true;
    }
  });

  console.log(rarePrizes)
  console.log(doorPrizes)
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
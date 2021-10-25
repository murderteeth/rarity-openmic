const { expect } = require("chai");
const { smock } = require("@defi-wonderland/smock");
const isSvg = require('is-svg');
const { classes } = require("../rarityjs/classes");
const { skills } = require("../rarityjs/skills");
const { ethers } = require("hardhat");

describe("rarityOpenMicV2", function () {
  beforeEach(async function () {
    this.rarity = await (await smock.mock("contracts/rarity/rarity.sol:rarity")).deploy();
    this.attributes = await (await smock.mock("contracts/rarity/rarity_attributes.sol:rarity_attributes")).deploy();
    this.skills = await (await smock.mock("contracts/rarity/rarity_skills.sol:rarity_skills")).deploy();
    this.skillsCodex = await (await smock.mock("contracts/rarity/codex_skills.sol:codex")).deploy();
    this.random = await (await smock.mock("contracts/rarity/codex_base_random_mockable.sol:codex")).deploy();

    await this.rarity.setVariable("next_summoner", 1);  //init at 1 so we don't mint to summoner zero (which breaks ERC721)
    await this.attributes.setVariable("rm", this.rarity.address);
    await this.skills.setVariable("rm", this.rarity.address);
    await this.skills.setVariable("_attr", this.attributes.address);
    await this.skills.setVariable("_codex_skills", this.skillsCodex.address);

    this.theRarityForest = await (await ethers.getContractFactory("TheRarityForest")).deploy(
      this.rarity.address);
    this.theRarityForestV2 = await (await ethers.getContractFactory("TheRarityForestV2")).deploy(
      this.rarity.address, 
      this.theRarityForest.address);
    await this.theRarityForestV2.deployed();
    this.rarityXpProxy = await (await ethers.getContractFactory("rarity_xp_proxy")).deploy();
    this.theRarityForestV3 = await (await ethers.getContractFactory("TheRarityForestV3")).deploy(
      this.rarity.address, 
      this.theRarityForest.address,
      this.theRarityForestV2.address,
      this.rarityXpProxy.address);
    await this.theRarityForestV3.deployed();

    this.rarityOpenMic = await (await ethers.getContractFactory("RarityOpenMic")).deploy(
      this.rarity.address,
      this.attributes.address,
      this.skills.address,
      this.random.address,
      this.theRarityForestV2.address);

    this.rarityOpenMicV2 = await (await ethers.getContractFactory("RarityOpenMicV2")).deploy(
      this.rarity.address,
      this.attributes.address,
      this.skills.address,
      this.random.address,
      this.theRarityForestV3.address,
      this.rarityOpenMic.address);
  });

  it("rejects non-bards", async function () {
    const summoner = await this.rarity.next_summoner();
    await this.rarity.summon(classes.barbarian);
    await this.rarity.setVariable("level", { [summoner]: 10 });
    await expect(this.rarityOpenMicV2.perform(summoner)).to.be.reverted;
  });

  it("rejects low level scum", async function () {
    const summoner = await this.rarity.next_summoner();
    await this.rarity.summon(classes.bard);
    expect((await this.rarity.summoner(summoner))._level).to.eq(1);
    await expect(this.rarityOpenMicV2.perform(summoner)).to.be.reverted;
  });

  it("fails if a bard has zero perform skill", async function () {
    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });
    const performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(1);
    const { check, success } = performance.events[0].args;
    expect(check.toNumber()).to.be.eq(0);
    expect(success).to.be.false;
  });

  it("fails on a critical miss, even for the most powerful of bards", async function () {
    await this.random.setMockResult(0);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    const performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(1);
    const { check, success } = performance.events[0].args;
    expect(check.toNumber()).to.be.eq(1);
    expect(success).to.be.false;

  });

  it("awards a door prize to bards that succeed their skill check", async function () {
    await this.random.setMockResult(1);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    const performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(3);
    const { check, success } = performance.events[0].args;
    expect(check.toNumber()).to.be.gt(1);
    expect(success).to.be.true;

    const { tokenId: doorPrizeId } = performance.events[2].args;
    const prizes = await this.rarityOpenMicV2.getPrizes(summoner);
    expect(prizes).to.have.lengthOf(1);
    expect(prizes[0].tokenId.toString()).to.eq(doorPrizeId.toString());
    expect(prizes[0].rare).to.be.false;

    const log = await this.rarityOpenMicV2.getPerformance(summoner);
    expect(log.success).to.be.true;
    expect(log.blockTime).to.be.gt(0);

  });

  it("awards a rare prize to bards that crit their performance", async function () {
    await this.random.setMockResult(19);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    const performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(3);
    const { check, success } = performance.events[0].args;
    expect(check.toNumber()).to.be.gt(1);
    expect(success).to.be.true;

    const { tokenId } = performance.events[2].args;
    const prizes = await this.rarityOpenMicV2.getPrizes(summoner);
    expect(prizes).to.have.lengthOf(1);
    expect(prizes[0].tokenId.toString()).to.eq(tokenId.toString());
    expect(prizes[0].rare).to.be.true;

    const log = await this.rarityOpenMicV2.getPerformance(summoner);
    expect(log.success).to.be.true;
    expect(log.blockTime).to.be.gt(0);

  });

  it("increments the bard's check if they have any treasure from the forest", async function () {
    await this.random.setMockResult(1);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    let performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(3);
    let check = performance.events[0].args.check;
    expect(check.toNumber()).to.be.eq(11);

    await this.theRarityForestV3.startResearch(summoner, 4);
    await network.provider.send("evm_increaseTime", [2 * (4 * 24 * 60 * 60)]);
    await this.theRarityForestV3.discover(summoner);
    performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(3);
    check = performance.events[0].args.check;
    expect(check.toNumber()).to.be.eq(12);

  });

  it("rejects bards that don't wait 7 days to retake the stage", async function () {
    await this.random.setMockResult(1);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    await this.rarityOpenMicV2.perform(summoner);
    await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await this.rarityOpenMicV2.perform(summoner);
    await expect(this.rarityOpenMicV2.perform(summoner)).to.be.reverted;
    await network.provider.send("evm_increaseTime", [6 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await expect(this.rarityOpenMicV2.perform(summoner)).to.be.reverted;
    await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await this.rarityOpenMicV2.perform(summoner);

  });

  it("returns how long a bard has to wait for their next performance", async function () {
    await this.random.setMockResult(1);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    expect((await this.rarityOpenMicV2.timeToNextPerformance(summoner)).toNumber()).to.eq(0);
    await this.rarityOpenMicV2.perform(summoner);
    expect((await this.rarityOpenMicV2.timeToNextPerformance(summoner)).toNumber()).to.eq(7 * 24 * 60 * 60);

    await network.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    expect((await this.rarityOpenMicV2.timeToNextPerformance(summoner)).toNumber()).to.eq(5 * 24 * 60 * 60);

    await network.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    expect((await this.rarityOpenMicV2.timeToNextPerformance(summoner)).toNumber()).to.eq(0);

    await network.provider.send("evm_increaseTime", [100 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    expect((await this.rarityOpenMicV2.timeToNextPerformance(summoner)).toNumber()).to.eq(0);

  });

  it("makes valid token uris", async function () {
    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    await this.random.setMockResult(1);
    await (await this.rarityOpenMicV2.perform(summoner)).wait();
    await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await this.random.setMockResult(19);
    await (await this.rarityOpenMicV2.perform(summoner)).wait();

    const prizes = await this.rarityOpenMicV2.getPrizes(summoner);
    {
      const { tokenId } = prizes[0];
      const tokenUri = await this.rarityOpenMicV2.tokenURI(tokenId);
      const tokenJson = JSON.parse(Buffer.from(tokenUri.split(',')[1], "base64").toString());
      const tokenSvg = Buffer.from(tokenJson.image.split(',')[1], "base64").toString();
      expect(tokenJson.name).to.eq("prize #0");
      expect(tokenJson.description).to.eq("Door prize from RarityOpenMic");
      expect(isSvg(tokenSvg)).to.be.true;
    }

    {
      const { tokenId } = prizes[1];
      const tokenUri = await this.rarityOpenMicV2.tokenURI(tokenId);
      const tokenJson = JSON.parse(Buffer.from(tokenUri.split(',')[1], "base64").toString());
      const tokenSvg = Buffer.from(tokenJson.image.split(',')[1], "base64").toString();
      expect(tokenJson.name).to.eq("prize #1");
      expect(tokenJson.description).to.eq("Rare prize from RarityOpenMic");
      expect(isSvg(tokenSvg)).to.be.true;
    }

  });

  it("rejects non-owner prize transfers", async function () {
    await this.random.setMockResult(1);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    const performance = await (await this.rarityOpenMicV2.perform(summoner)).wait();
    const { tokenId } = performance.events[2].args;

    {
      const signers = await ethers.getSigners();
      const defaultWallet = signers[0];
      const nonOwnerWallet = signers[2];
      expect(defaultWallet.address).to.not.eq(nonOwnerWallet.address);

      const rarity = this.rarity.connect(nonOwnerWallet);
      const rarityOpenMicV2 = this.rarityOpenMicV2.connect(nonOwnerWallet);
      const summoner2 = (await rarity.next_summoner()).toNumber();
      await rarity.summon(classes.bard);

      await expect(rarityOpenMicV2.transferFrom(summoner, summoner, summoner2, tokenId)).to.be.reverted
      await expect(this.rarityOpenMicV2.transferFrom(summoner, summoner, summoner2, tokenId)).to.not.be.reverted
    }

  });

  it("remints prizes, v1 to v2", async function () {
    await this.random.setMockResult(19);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);

    const performance = await (await this.rarityOpenMic.perform(summoner)).wait();
    expect(performance.events).to.have.lengthOf(5);
    const { check, success } = performance.events[0].args;
    const { tokenId: doorPrizeId } = performance.events[2].args;
    const { tokenId: rarePrizeId } = performance.events[4].args;
    expect(check.toNumber()).to.be.gt(1);
    expect(success).to.be.true;

    expect(await this.rarityOpenMicV2.getPrizes(summoner)).to.be.empty;

    await this.rarityOpenMicV2.remintV1Prizes(doorPrizeId, rarePrizeId);

    const prizes = await this.rarityOpenMicV2.getPrizes(summoner);
    expect(prizes).to.have.lengthOf(2);
    expect(prizes[0].tokenId.toString()).to.eq(doorPrizeId.toString());
    expect(prizes[0].rare).to.be.false;
    expect(prizes[1].tokenId.toString()).to.eq(rarePrizeId.toString());
    expect(prizes[1].rare).to.be.true;

  });

  it("reverts remints from non owner", async function () {
    await this.random.setMockResult(19);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);
    await this.rarityOpenMic.perform(summoner);

    const signers = await ethers.getSigners();
    const nonOwnerWallet = signers[2];
    await this.rarityOpenMicV2.remintV1Prizes(0, 1);
    await this.rarityOpenMicV2.remintV1Prizes(0, 1);
    const rarityOpenMicV2 = this.rarityOpenMicV2.connect(nonOwnerWallet);
    await expect(rarityOpenMicV2.remintV1Prizes(0, 1)).to.be.reverted;

  });

  it("reverts closeV1Remint from non owner", async function () {
    const signers = await ethers.getSigners();
    const nonOwnerWallet = signers[2];

    await this.rarityOpenMicV2.closeV1Remint();
    await this.rarityOpenMicV2.closeV1Remint();
    const rarityOpenMicV2 = this.rarityOpenMicV2.connect(nonOwnerWallet);
    await expect(rarityOpenMicV2.closeV1Remint()).to.be.reverted;

  });

  it("reverts remint after closeV1Remint", async function () {
    await this.random.setMockResult(19);

    const summoner = (await this.rarity.next_summoner()).toNumber();
    await this.rarity.summon(classes.bard);
    await this.attributes.point_buy(summoner, 8, 8, 12, 15, 12, 18);
    await this.rarity.setVariable("level", { [summoner]: 2 });

    const skillPoints = Array(36).fill(0);
    skillPoints[skills.perform] = 5;
    await this.skills.set_skills(summoner, skillPoints);
    await this.rarityOpenMic.perform(summoner);

    await this.rarityOpenMicV2.remintV1Prizes(0, 1);
    await this.rarityOpenMicV2.remintV1Prizes(0, 1);
    await this.rarityOpenMicV2.closeV1Remint();
    await expect(this.rarityOpenMicV2.remintV1Prizes(0, 1)).to.be.reverted;

  });

});
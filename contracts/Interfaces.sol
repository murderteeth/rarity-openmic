//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

interface IAttributes {
  function ability_scores(uint) external view returns (uint32, uint32, uint32, uint32, uint32, uint32);
}

interface ISkills {
  function get_skills(uint summoner) external view returns (uint8[36] memory);
}

interface ICodexBaseRandom {
  function dn(uint summoner, uint n) external view returns (uint);
}

interface IForest {
  function getTreasuresBySummoner(uint256 summonerId) external view returns (ForestTreasure[] memory);
}

interface IOpenMicV1 {
  function ownerOf(uint tokenId) external view returns (uint owner);
  function getPrizes(uint summoner) external view returns (PrizeView[] memory);
}

struct ForestTreasure {
  uint256 summonerId;
  uint256 treasureId;
  string itemName;
  uint256 magic;
  uint256 level;
}

struct Performance {
  uint blockTime;
  bool success;
}

struct Prize {
  bool rare;
  uint index;
}

struct PrizeView {
  uint tokenId;
  bool rare;
  uint index;
  string name;
}
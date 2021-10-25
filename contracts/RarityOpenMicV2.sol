//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import "./ERC721EnumerableFixed.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Interfaces.sol";

contract RarityOpenMicV2 is ERC721Enumerable {

  address public owner;
  using Counters for Counters.Counter;

  constructor(address _rarity, address _attributes, address _skills, address _codex_base_random, address _forest, address _openmicV1) ERC721(_rarity) {
    owner = msg.sender;
    rarity = IRarity(_rarity);
    attributes = IAttributes(_attributes);
    skills = ISkills(_skills);
    random = ICodexBaseRandom(_codex_base_random);
    forest = IForest(_forest);
    openmicV1 = IOpenMicV1(_openmicV1);
  }

  modifier ownerOnly {
    require(msg.sender == owner);
    _;
  }

  event Perform(address indexed sender, uint summoner, int check, bool success, bool crit);
  event PrizeAwarded(uint summoner, uint tokenId);

  string constant public name = "RarityOpenMicV2";
  string constant public symbol = "ROMv2";
  uint constant public difficultyClass = 10;
  uint constant public intermission = 7 days;
  uint constant public perform_skill = 22;

  IRarity immutable public rarity;
  IAttributes immutable public attributes;
  ISkills immutable public skills;
  ICodexBaseRandom immutable public random;
  IForest immutable public forest;
  IOpenMicV1 immutable public openmicV1;
  Counters.Counter public tokenCounter;

  string[] public doorPrizes = [
    "Hawk signet ring",
    "Badger signet ring",
    "Song Bird signet ring",
    "Skunk signet ring",
    "Cat signet ring",
    "Dog signet ring",
    "Fish signet ring",
    "Shark signet ring",
    "Lion signet ring",
    "Tiger signet ring",
    "Snake signet ring",
    "Crate of goblin wine",
    "Expired rations",
    "Mysterious black stone"
  ];

  string[] public rarePrizes = [
    "Secret mission pass from Prince Andre",
    "Secret mission pass from The Austrian",
    "Secret mission pass from Murderteeth"
  ];

  function getDoorPrizes() public view returns (string[] memory) {
    return doorPrizes;
  }

  function getRarePrizes() public view returns (string[] memory) {
    return rarePrizes;
  }

  mapping(uint => Performance) performances;
  mapping(uint => Prize) tokens;

  function getPerformance(uint summoner) public view returns (Performance memory) {
    return performances[summoner];
  }

  function timeToNextPerformance(uint summoner) public view returns (uint) {
    Performance memory latestPerformance = getPerformance(summoner);
    uint nextPerformance = latestPerformance.blockTime + intermission;
    if(nextPerformance < block.timestamp) {
      return 0;
    } else {
      return nextPerformance - block.timestamp;
    }
  }

  function getPrize(uint tokenId) public view returns (PrizeView memory) {
    Prize memory prize = tokens[tokenId];
    if(prize.rare) {
      return PrizeView(tokenId, true, prize.index, rarePrizes[prize.index]);
    } else {
      return PrizeView(tokenId, false, prize.index, doorPrizes[prize.index]);
    }
  }

  function getPrizes(uint summoner) public view returns (PrizeView[] memory) {
    uint arrayLength = balanceOf(summoner);
    PrizeView[] memory result = new PrizeView[](arrayLength);
    for (uint i = 0; i < arrayLength; i++) {
      uint tokenId = tokenOfOwnerByIndex(summoner, i);
      result[i] = getPrize(tokenId);
    }
    return result;
  }

  function perform(uint256 summoner) external {
    require(_isApprovedOrOwner(summoner, msg.sender), "don't be sneaky!");

    uint waitTime = timeToNextPerformance(summoner);
    require(waitTime == 0, string(abi.encodePacked("wait ", toString(waitTime), "seconds to perform again")));

    (,,uint class,uint level) = rarity.summoner(summoner);
    require(class == 2, "summoner is not a bard");
    require(level >= 2, "level < 2");

    (int check, bool success, bool crit) = skillCheck(summoner, difficultyClass, perform_skill);
    performances[summoner] = Performance(block.timestamp, success);
    emit Perform(msg.sender, summoner, check, success, crit);

    if(success && !crit) {
      uint tokenId = safeMint(summoner);
      uint random = uint(keccak256(abi.encodePacked(block.timestamp, tokenId)));
      uint prize = uint16(random % doorPrizes.length);
      tokens[tokenId] = Prize(false, prize);
      emit PrizeAwarded(summoner, tokenId);
    }

    if(crit) {
      uint tokenId = safeMint(summoner);
      uint random = uint(keccak256(abi.encodePacked(block.timestamp, tokenId)));
      uint prize = uint16(random % rarePrizes.length);
      tokens[tokenId] = Prize(true, prize);
      emit PrizeAwarded(summoner, tokenId);
    }

  }

  function skillCheck(uint summoner, uint dc, uint skill) internal view returns (int check, bool success, bool crit) {
    check = int(uint(skills.get_skills(summoner)[skill]));
    if(check == 0) return (0, false, false);

    (,,,,,uint CHA) = attributes.ability_scores(summoner);
    check += calcModifier(CHA);
    if(check <= 0) return (0, false, false);

    int roll = int(d20(summoner));
    if(roll == 1) {
      return (1, false, false);
    }
    check += roll;

    check += int(calcForestModifier(summoner));
    return (check, check >= int(dc), roll == 20);
  }

  function calcModifier(uint ability) internal pure returns (int) {
    if (ability < 10) return -1;
    return (int(ability) - 10) / 2;
  }

  function calcForestModifier(uint summoner) internal view returns (uint) {
    ForestTreasure[] memory treasures = forest.getTreasuresBySummoner(summoner);
    if(treasures.length > 0) {
      return 1;
    } else {
      return 0;
    }
  }

  function d20(uint summoner) internal view returns (uint) {
    return dn(summoner, 20);
  }

  function dn(uint summoner, uint number) internal view returns (uint) {
    return random.dn(summoner, number) + 1;
  }

  function _isApprovedOrOwner(uint summoner, address sender) internal view virtual returns (bool) {
    address spender = address(this);
    address owner = rarity.ownerOf(summoner);
    return (owner == sender || rarity.getApproved(summoner) == spender || rarity.isApprovedForAll(owner, spender));
  }

  function safeMint(uint to) internal returns (uint tokenId) {
    tokenId = tokenCounter.current();
    _safeMint(to, tokenId, "");
    tokenCounter.increment();
  }

  bool public v1RemintOpen = true;

  function remintV1Prizes(uint fromTokenId, uint toTokenId) public ownerOnly {
    require(v1RemintOpen, "Remint closed");
    require(toTokenId - fromTokenId < 11, "Remint limited to lots fo 10");
    uint limit = toTokenId + 1;
    for (uint tokenId = fromTokenId; tokenId < limit; tokenId++) {
      uint summoner = openmicV1.ownerOf(tokenId);
      PrizeView[] memory prizes = openmicV1.getPrizes(summoner);
      for (uint p = 0; p < prizes.length; p++) {
        PrizeView memory prize = prizes[p];
        if(prize.tokenId == tokenId) {
          uint newTokenId = safeMint(summoner);
          tokens[newTokenId] = Prize(prize.rare, prize.index);
        }
      }
    }
  }

  function closeV1Remint() public ownerOnly {
    v1RemintOpen = false;
  }

  function tokenURI(uint256 tokenId) public view returns (string memory) {
    Prize memory prize = tokens[tokenId];
    string memory _name;
    string memory _description;
    if(prize.rare) {
      _name = rarePrizes[prize.index];
      _description = "Rare prize from RarityOpenMic";
    } else {
      _name = doorPrizes[prize.index];
      _description = "Door prize from RarityOpenMic";
    }

    string[3] memory parts;
    parts[0] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';
    parts[1] = string(abi.encodePacked("name", " ", _name));
    parts[2] = '</text></svg>';

    string memory output = string(abi.encodePacked(parts[0], parts[1], parts[2]));
    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "prize #', toString(tokenId), '", "description": "', _description, '", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'))));
    output = string(abi.encodePacked('data:application/json;base64,', json));

    return output;
  }

  // Inspired by OraclizeAPI's implementation - MIT license
  // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
  function toString(uint256 value) internal pure returns (string memory) {
    if (value == 0) {
        return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
        digits++;
        temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
        digits -= 1;
        buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
        value /= 10;
    }
    return string(buffer);
  }

}

/// [MIT License]
/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
  bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  /// @notice Encodes some bytes to the base64 representation
  function encode(bytes memory data) internal pure returns (string memory) {
    uint256 len = data.length;
    if (len == 0) return "";

    // multiply by 4/3 rounded up
    uint256 encodedLen = 4 * ((len + 2) / 3);

    // Add some extra buffer at the end
    bytes memory result = new bytes(encodedLen + 32);

    bytes memory table = TABLE;

    assembly {
      let tablePtr := add(table, 1)
      let resultPtr := add(result, 32)

      for {
        let i := 0
      } lt(i, len) {

      } {
        i := add(i, 3)
        let input := and(mload(add(data, i)), 0xffffff)

        let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
        out := shl(8, out)
        out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
        out := shl(8, out)
        out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
        out := shl(8, out)
        out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
        out := shl(224, out)

        mstore(resultPtr, out)

        resultPtr := add(resultPtr, 4)
      }

      switch mod(len, 3)
      case 1 {
        mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
      }
      case 2 {
        mstore(sub(resultPtr, 1), shl(248, 0x3d))
      }

      mstore(result, encodedLen)
    }

    return string(result);
  }
}

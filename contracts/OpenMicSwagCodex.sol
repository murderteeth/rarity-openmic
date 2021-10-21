//SPDX-License-Identifier: UNLICENSED
//
// made by a bot
//
pragma solidity 0.8.7;

contract codex {
  string constant public index = "Items";
  string constant public class = "Open Mic Swag";
  function item_by_id(uint _id) public pure returns(
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ) {
    if (_id == 1) {
      return secret_mission_pass_from_prince_andre();
    } else if (_id == 2) {
      return secret_mission_pass_from_the_austrian();
    } else if (_id == 3) {
      return secret_mission_pass_from_murderteeth();
    }
  }

  function secret_mission_pass_from_prince_andre() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 1;
    cost = 500e18;
    weight = 0;
    name = "Secret mission pass from Prince Andre";
    description = "The envelope feels hot...";
  }

  function secret_mission_pass_from_the_austrian() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 2;
    cost = 500e18;
    weight = 0;
    name = "Secret mission pass from The Austrian";
    description = "The envelope feels cold...";
  }

  function secret_mission_pass_from_murderteeth() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 3;
    cost = 500e18;
    weight = 0;
    name = "Secret mission pass from Murderteeth";
    description = "The envelope feels just right...";
  }
}
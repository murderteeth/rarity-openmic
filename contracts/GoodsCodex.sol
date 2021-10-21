//SPDX-License-Identifier: UNLICENSED
//
// made by a bot
//
pragma solidity 0.8.7;

contract codex {
  string constant public index = "Items";
  string constant public class = "Goods";
  function item_by_id(uint _id) public pure returns(
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ) {
    if (_id == 1) {
      return hawk_signet_ring();
    } else if (_id == 2) {
      return badger_signet_ring();
    } else if (_id == 3) {
      return song_bird_signet_ring();
    } else if (_id == 4) {
      return skunk_signet_ring();
    } else if (_id == 5) {
      return cat_signet_ring();
    } else if (_id == 6) {
      return dog_signet_ring();
    } else if (_id == 7) {
      return fish_signet_ring();
    } else if (_id == 8) {
      return shark_signet_ring();
    } else if (_id == 9) {
      return lion_signet_ring();
    } else if (_id == 10) {
      return tiger_signet_ring();
    } else if (_id == 11) {
      return snake_signet_ring();
    } else if (_id == 12) {
      return crate_of_goblin_wine();
    } else if (_id == 13) {
      return expired_rations();
    } else if (_id == 14) {
      return mysterious_black_stone();
    }
  }

  function hawk_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 1;
    cost = 5e18;
    weight = 0;
    name = "Hawk signet ring";
    description = "A common signet ring";
  }

  function badger_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 2;
    cost = 5e18;
    weight = 0;
    name = "Badger signet ring";
    description = "A common signet ring";
  }

  function song_bird_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 3;
    cost = 5e18;
    weight = 0;
    name = "Song Bird signet ring";
    description = "A common signet ring";
  }

  function skunk_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 4;
    cost = 5e18;
    weight = 0;
    name = "Skunk signet ring";
    description = "A common signet ring";
  }

  function cat_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 5;
    cost = 5e18;
    weight = 0;
    name = "Cat signet ring";
    description = "A common signet ring";
  }

  function dog_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 6;
    cost = 5e18;
    weight = 0;
    name = "Dog signet ring";
    description = "A common signet ring";
  }

  function fish_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 7;
    cost = 5e18;
    weight = 0;
    name = "Fish signet ring";
    description = "A common signet ring";
  }

  function shark_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 8;
    cost = 5e18;
    weight = 0;
    name = "Shark signet ring";
    description = "A common signet ring";
  }

  function lion_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 9;
    cost = 5e18;
    weight = 0;
    name = "Lion signet ring";
    description = "A common signet ring";
  }

  function tiger_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 10;
    cost = 5e18;
    weight = 0;
    name = "Tiger signet ring";
    description = "A common signet ring";
  }

  function snake_signet_ring() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 11;
    cost = 5e18;
    weight = 0;
    name = "Snake signet ring";
    description = "A common signet ring";
  }

  function crate_of_goblin_wine() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 12;
    cost = 1e18;
    weight = 5;
    name = "Crate of goblin wine";
    description = "A crate of the liquid foulness";
  }

  function expired_rations() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 13;
    cost = 0e18;
    weight = 1;
    name = "Expired rations";
    description = "This was a tidy meal once";
  }

  function mysterious_black_stone() public pure returns (
    uint id,
    uint cost,
    uint weight,
    string memory name,
    string memory description
  ){
    id = 14;
    cost = 5e18;
    weight = 2;
    name = "Mysterious black stone";
    description = "This stone seems lost...";
  }
}
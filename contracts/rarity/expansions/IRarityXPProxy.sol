pragma solidity 0.8.7;

interface IRarityXPProxy {
    function spend_xp(uint _summoner, uint _xp) external returns (bool);
}
pragma solidity 0.8.7;

interface ITheRarityForestV2 {
    function transferFrom(uint from, uint to, uint256 tokenId) external;
    function treasure(uint tokenId) external view returns (uint _summonerId, string memory _itemName, uint _magic, uint _level);
    function ownerOf(uint256 tokenId) external view returns (uint owner);
}
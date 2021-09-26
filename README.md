# Rarity Open Mic 🎶

Rarity Open Mic is an expansion for [rarity](https://github.com/andrecronje/rarity/).

[Rarity Open Mic Contract @ FTMScan](https://ftmscan.com/address/0x46Fe9AAd56f486950ed3732A91552e3919e5713F#code)

![Rarity Open Mic](https://cdn.arstechnica.net/wp-content/uploads/2018/03/BardsTaletavern-800x450.jpg)

A lithe, robed figure takes the stage with a flourish. The bard sings out and a hush sweeps over the rowdy tavern...

Your bard rolls a Perform skill check with these outcomes:
- Fail the DC, booed off the stage, your bard gets no prize
- Make the DC, the tavern cheers politely, your bard gets a door prize
- Roll a nat20, the tavern is an orgy of good vibes, your bard gets a door prize and a secret mission pass

### Requirements
- Your summoner must be a [Bard](https://rarity.fandom.com/wiki/Bard) to perform
- Level > 1
- Perform skill > 0
- Your summoner can only perform once every 7 days

### Rewards
- Door prizes
- Secret mission passes

### Skill check modifiers
- Charisma bonus
- +1 if your summoner has any treasure from [theRarityForest](https://github.com/TheAustrian1998/theRarityForest)

#### Inspired by [theRarityForest](https://github.com/TheAustrian1998/theRarityForest)

- - -

### API
`RarityOpenMic.perform(summoner)`

`RarityOpenMic.getPerformance(summoner)`

`RarityOpenMic.timeToNextPerformance(summoner)`

`RarityOpenMic.getPrizes(summoner)`

### Dev
Setup like this
```
git clone <this repo>
cd <this repo>
yarn
cp secrets.example.json secrets.json
```
- Get an api key from [ftmscan](https://ftmscan.com) 
- Put your ftmscan api key and your wallet private key in secrets.json

Test like this
```
npx hardhat test
```

Exercise like this
```
npx hardhat run scripts/exercise.js
```

Deploy like this
```
npx hardhat run scripts/deploy.js --network testnet
```
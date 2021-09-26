const classes = {
  barbarian: 1,
  bard: 2,
  cleric: 3,
  druid: 4,
  fighter: 5,
  monk: 6,
  paladin: 7,
  ranger: 8,
  rogue: 9,
  sorcerer: 10,
  wizard: 11
}

function getClass(id) {
  return Object.keys(classes)[id - 1];
}

module.exports = { classes, getClass };
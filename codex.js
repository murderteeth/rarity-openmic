const fs = require('fs')
const caser = require('./caser')

const pragma = '0.8.7'
const officialcodex = './officialcodex'
const contracts = './contracts'

async function main() {
  console.log('🤖 Generate solidity codex files...')
  const codexes = (await fs.promises.readdir(officialcodex))
    .filter(file => file.endsWith('.json'))

  const codex = []
  for(let i = 0; i < codexes.length; i++) {
    const path = `${officialcodex}/${codexes[i]}`
    const items = JSON.parse(await fs.promises.readFile(path))
    codex.push(...items)
  }

  const classes = Array.from(new Set(codex.map(item => item.class)))
  for(let i = 0; i < classes.length; i ++) {
    const codexClass = classes[i]
    const codexItems = codex.filter(item => item.class === codexClass)
    const className = `${contracts}/${caser.filename(codexClass)}Codex`
    const path = `${className}.sol`

    const lines = []
    lines.push('//SPDX-License-Identifier: UNLICENSED')
    lines.push('//')
    lines.push('// made by a bot')
    lines.push('//')
    lines.push(`pragma solidity ${pragma};`)
    lines.push('')
    lines.push('contract codex {')
    lines.push('  string constant public index = "Items";')
    lines.push(`  string constant public class = "${codexClass}";`)

    lines.push('  function item_by_id(uint _id) public pure returns(')
    lines.push('    uint id,')
    lines.push('    uint cost,')
    lines.push('    uint weight,')
    lines.push('    string memory name,')
    lines.push('    string memory description')
    lines.push('  ) {')
    codexItems.forEach((item, index) => {
      if(!index) {
        lines.push(`    if (_id == ${item.id}) {`)
        lines.push(`      return ${caser.snake(item.name)}();`)
      } else {
        lines.push(`    } else if (_id == ${item.id}) {`)
        lines.push(`      return ${caser.snake(item.name)}();`)
      }
    })
    lines.push(`    }`)
    lines.push('  }')

    codexItems.forEach(item => {
      lines.push('')
      lines.push(`  function ${caser.snake(item.name)}() public pure returns (`)
      lines.push('    uint id,')
      lines.push('    uint cost,')
      lines.push('    uint weight,')
      lines.push('    string memory name,')
      lines.push('    string memory description')
      lines.push('  ){')
      lines.push(`    id = ${item.id};`)
      lines.push(`    cost = ${item.cost}e18;`)
      lines.push(`    weight = ${item.weight};`)
      lines.push(`    name = "${item.name}";`)
      lines.push(`    description = "${item.description}";`)
      lines.push('  }')
    })

    lines.push('}')

    await fs.promises.writeFile(path, lines.join('\n'))
    console.log('🤖 Write codex ' + path)
  }
  console.log('🤖 Done')
}

main()
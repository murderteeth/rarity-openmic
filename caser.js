module.exports = {
  snake: (text) => {
    let result = text.replace(/\s+/g, '_')
    result = result.replace(/([^_])([A-Z])/g, `$1_$2`)
    return result.toLowerCase()
  },

  filename: (text) => {
    return text.replace(/\s+/g, '')
  }
}
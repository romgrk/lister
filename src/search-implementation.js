/*
 * search-implementation.js
 */

let fzy
try {
  fzy = require('node-fzy')
} catch (err) {
  fzy = require('./fzy')
}

module.exports = search

function search(query, items) {
  const results = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const haystack = item.text

    if (fzy.hasMatch(query, haystack)) {
      const [score, positions]= fzy.matchPositions(query, haystack)
      results.push({ item, score, positions })
    }
  }

  results.sort((a, b) => b.score - a.score)

  return results
}

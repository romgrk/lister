/*
 * search-implementation.js
 */

const fzy = require('./fzy')

module.exports = search

function search(query, items) {
  const results = items.reduce((acc, i) => {
    const [score, positions]= fzy.scoreAndPositions(query, i.text)
    if (score > -100)
      acc.push({ item: i, score, positions })
    return acc
  }, [])
  results.sort((a, b) => b.score - a.score)
  return results
}

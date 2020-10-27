/*
 * test.js
 */

const js = require('../src/fzy').scoreAndPositions
const c  = require('node-fzy').matchPositions

const files = require('./data/files.json')


run()

function run() {
  test('JS', js)
  test('C',  c)
}

function test(name, fn) {
  console.time(name)
  search('file', files, fn)
  console.timeEnd(name)
}

function search(query, items, fn) {
  const results = items.reduce((acc, i) => {
    const [score, positions]= fn(query, i)
    if (score > -100)
      acc.push({ item: i, score, positions })
    return acc
  }, [])
  results.sort((a, b) => b.score - a.score)
  return results
}

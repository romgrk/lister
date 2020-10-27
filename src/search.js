/*
 * search.js
 */

const path = require('path')
const { Worker } = require('worker_threads')
const searchImplementation = require('./search-implementation')

module.exports = { search, asMatches, asItems }

let worker = undefined

function asItems(matches) {
  return matches.map(m => m.item)
}

function asMatches(items) {
  return items.map(item =>
    ({ item, score: 0, positions: [] }))
}

function search(query, items) {
  if (query === '')
    return Promise.resolve(asMatches(items))

  if (items.length < 10000)
    return Promise.resolve(searchImplementation(query, items))

  console.log('search:worker', [items.length])

  return new Promise((resolve, reject) => {
    if (worker !== undefined)
      worker.terminate()
    worker = new Worker(path.join(__dirname, 'search-worker.js'), {
      workerData: { query, items }
    })
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`))
      worker = undefined
    })
  })
}

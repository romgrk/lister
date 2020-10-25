/*
 * search.js
 */

const path = require('path')
const { Worker } = require('worker_threads')
const search = require('./search-implementation')

module.exports = run

let worker = undefined

function run(query, items) {
  if (query === '')
    return Promise.resolve(items.map(item =>
      ({ item, score: 0, positions: [] })))

  if (items.length < 1000)
    return Promise.resolve(search(query, items))

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

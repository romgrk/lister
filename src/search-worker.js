/*
 * search-worker.js
 */

const { parentPort, workerData } = require('worker_threads')
const { query, items } = workerData
const search = require('./search-implementation')

parentPort.postMessage(search(query, items))

#!/usr/bin/env node
/*
 * index.js
 */

const net = require('net')
const gi = require('node-gtk')
const Gtk     = gi.require('Gtk', '3.0')
const Gdk     = gi.require('Gdk', '3.0')
const WebKit2 = gi.require('WebKit2')

const { delay } = require('./promise')
const ListerWindow = require('./ui/window')

const linesToItems = lines => lines.map(f => ({ text: f }))

// const files = linesToItems(require('../data/files.json'))


/*
 * Main
 */

// Start the GLib event loop
gi.startLoop()

async function main() {
  const server = net.createServer((socket) => {
    let meta = undefined
    let data = ''

    socket.on('data', buffer => {
      const text = buffer.toString()

      if (meta === undefined) {
        const index = text.indexOf('\n')
        console.log('parsing: ', text.slice(0, index))
        meta = JSON.parse(text.slice(0, index))
        data += text.slice(index + 1)
        console.log('parsed: ', meta)
      }
      else {
        data += text
      }

      console.log(`data: got ${data.length} on ${meta.length}`)

      if (data.length >= meta.length) {
        console.log('running', data.length)
        run()
      }
    })

    socket.on('end', data => {
      console.log('socket end')
    })

    function run() {
      const items = linesToItems(JSON.parse(data))
      const window = new ListerWindow(items, meta.dimensions)
      const item = window.run()
      const response = { ok: Boolean(item), item: item || null }
      socket.write(JSON.stringify(response))
    }
  })

  server.listen(8556, '127.0.0.1')
}

async function mainDirect() {
  gi.startLoop()

  let shouldExit = true

  do {
    const window = new ListerWindow(files)
    window.showAll()
    // await delay(1000)
  } while (!shouldExit)
}


main()
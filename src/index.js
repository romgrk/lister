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
const Application = require('./ui/application')

const linesToItems = lines => lines.map(f => ({ text: f }))


/*
 * Main
 */

// Start the GLib event loop
gi.startLoop()


const app = new Application()
// app.run()

async function main() {

  const server = net.createServer((socket) => {
    let meta = undefined
    let data = ''

    socket.on('data', buffer => {
      const text = buffer.toString()

      data += text

      const index = data.indexOf('\n')
      if (index > 0) {
        console.log('running', data.length)
        meta = JSON.parse(data.slice(0, index))
        run()
      }
    })

    socket.on('end', data => {
      console.log('socket: end')
    })

    socket.on('close', data => {
      console.log('socket: close')
    })

    function run() {
      const item = app.window.run(meta)
      const response = { ok: Boolean(item), item: item || null }
      if (!socket.destroyed)
        socket.write(JSON.stringify(response))
    }
  })

  server.listen(8556, '127.0.0.1')
  console.log('Listening...')
}

async function mainDirect() {
  let shouldExit = true

  const files = linesToItems(require('../data/files.json'))

  do {
    const window = new ListerWindow(files)
    window.showAll()
    // await delay(1000)
  } while (!shouldExit)
}


main()

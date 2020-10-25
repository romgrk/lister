/*
 * client.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const net = require('net')
const { program } = require('commander')

program
  .option('-p, --position   <spec>', 'position')
  .option('-i, --input      <file>', 'input file')
 
program.parse(process.argv)

const dimensions = getDimensions()

const client = new net.Socket()
client.connect(8556, '127.0.0.1', () => {
  /* fs.createReadStream(program.input)
   *   .pipe(client) */

  // const buffer = fs.readFileSync(program.input)
  const buffer = JSON.stringify(execSync('fd -t f').toString().split('\n'))
  client.write(`${JSON.stringify({ length: buffer.length, dimensions })}\n`)
  client.write(buffer)
})

client.on('data', (data) => {
  console.log(data.toString())
  client.destroy() // kill client after server's response
})

client.on('close', () => {
  // console.log('Connection closed')
})

function getDimensions() {
  const lines = execSync(`xprop -root`).toString().split('\n')
  const id = lines.find(l => l.includes('_NET_ACTIVE_WINDOW')).match(/0x\w+/)[0]
  const props = execSync(`xwininfo -id ${id}`).toString().split('\n')
  return {
    x: findProp('Absolute upper-left X:', props),
    y: findProp('Absolute upper-left Y:', props),
    width: findProp('Width:', props),
    height: findProp('Height:', props),
  }
}

function findProp(name, lines) {
  return findInt(lines.find(l => l.includes(name)))
}

function findInt(line) {
  return parseInt(line.match(/\d+/)[0], 10)
}

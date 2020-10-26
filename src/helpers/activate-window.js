/*
 * activate-window.js
 */

const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const SCRIPT = path.join(__dirname, '../../bin/gnome-magic-window')

module.exports = activateWindow

// bash -c 'xdotool windowfocus $(xdotool search --name __lister__)'

function activateWindow(name) {
  return exec(`${SCRIPT} ${name}`)
}

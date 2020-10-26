/*
 * application.js
 */

const gi = require('node-gtk')
const isEqual = require('lodash.isequal')

require('./init')

const Gtk     = gi.require('Gtk', '3.0')
const Gdk     = gi.require('Gdk', '3.0')
const Gio     = gi.require('Gio', '3.0')

const ListerWindow = require('./window')


class Application extends Gtk.Application {
  constructor(window) {
    super(
      'com.github.romgrk.lister',
      Gio.ApplicationFlags.NONE
    )

    this.window = new ListerWindow(this)

    this.on('startup', this.onStartup)
    this.on('activate', this.onActivate)
  }

  onStartup() {
    console.log('startup')
  }

  onActivate() {
    console.log('activate')
  }
}

module.exports = Application

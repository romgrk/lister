/*
 * init.js
 */

const gi = require('node-gtk')

const Gtk     = gi.require('Gtk', '3.0')
const Gdk     = gi.require('Gdk', '3.0')

// Necessary to initialize the graphic environment.
// If this fails it means the host cannot show Gtk-3.0
Gtk.init()
Gdk.init([])

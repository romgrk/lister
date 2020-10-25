/*
 * window.js
 */

const gi = require('node-gtk')

const Gtk     = gi.require('Gtk', '3.0')
const Gdk     = gi.require('Gdk', '3.0')

const search = require('../search')
const ItemList = require('./item-list')

// Necessary to initialize the graphic environment.
// If this fails it means the host cannot show Gtk-3.0
Gtk.init()
Gdk.init([])

class ListerWindow extends Gtk.Window {

  constructor(items, parent) {
    super({ type : Gtk.WindowType.TOPLEVEL })
    this.items = items
    this.matches = []
    this.result = null

    this.container = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    this.input = new Gtk.SearchEntry()
    this.scrollWindow = new Gtk.ScrolledWindow()
    this.itemList = null

    /* Build our layout */
    this.container.packStart(this.input,        false, true, 0)
    this.container.packStart(this.scrollWindow, true,  true, 0)

    const width = 800
    const height = 400

    this.setPosition(Gtk.WindowPosition.CENTER_ON_PARENT)
    this.setDefaultSize(width, height)
    // this.setDeletable(false)
    this.setDecorated(false)
    this.setResizable(true)
    this.setKeepAbove(true)
    this.move(
      parent.x + (parent.width  - width)  / 2,
      parent.y + (parent.height - height) / 2,
    )
    this.add(this.container)
    this.update()

    /* Event handlers */
    this.on('show', this.onShow)
    this.on('destroy', Gtk.mainQuit)
    this.input.on('key-press-event', this.onKeyPressEvent)
    this.input.on('search-changed', this.update)
  }

  update = () => {
    const query = this.input.getText()
    // console.time('search')
    search(query, this.items)
    .then(matches => {
      this.matches = matches
      // console.timeEnd('search')
      this.itemList = new ItemList(this.matches)
      // console.log(query, matches.length)

      // console.time('update')
      const children = this.scrollWindow.getChildren()
      children.forEach(c => this.scrollWindow.remove(c))
      this.scrollWindow.add(this.itemList)
      this.scrollWindow.showAll()
      // console.timeEnd('update')
    })
    .catch(err => {
      console.error(err)
    })
  }

  run = () => {
    this.showAll()
    return this.result
  }

  accept = () => {
    this.result = this.itemList?.getSelectedItem()
    this.close()
  }

  onKeyPressEvent = (event) => {
    if (event.keyval === Gdk.KEY_Escape)
      this.close()
    if (event.keyval === Gdk.KEY_Return)
      this.accept()
  }

  onShow = () => {
    this.present()
    this.grabFocus()
    // This start the Gtk event loop. It is required to process user events.
    // It doesn't return until you don't need Gtk anymore, usually on window close.
    Gtk.main()
  }

}

module.exports = ListerWindow


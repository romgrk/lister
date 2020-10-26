/*
 * window.js
 */

const gi = require('node-gtk')
const isEqual = require('lodash.isequal')

const Gtk     = gi.require('Gtk', '3.0')
const Gdk     = gi.require('Gdk', '3.0')
gi.require('GdkX11', '3.0')

const GtkStyleProviderPriority = {
  FALLBACK:    1,
  THEME:       200,
  SETTINGS:    400,
  APPLICATION: 600,
  USER:        800,
}

const search = require('../search')
const ItemList = require('./item-list')

// Necessary to initialize the graphic environment.
// If this fails it means the host cannot show Gtk-3.0
Gtk.init()
Gdk.init([])

const display = Gdk.Display.getDefault()
const screen = display.getDefaultScreen()


const width  = 800
const height = 400

class ListerWindow extends Gtk.Window {

  constructor() {
    super({ type : Gtk.WindowType.TOPLEVEL })
    this.items = []
    this.matches = []
    this.result = null

    this.container = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    this.input = new Gtk.SearchEntry()
    this.scrollWindow = new Gtk.ScrolledWindow()
    this.itemList = null

    /* Build our layout */
    this.container.packStart(this.input,        false, true, 0)
    this.container.packStart(this.scrollWindow, true,  true, 0)

    this.setTitle('__lister__')
    this.setDefaultSize(width, height)
    // this.setDeletable(false)
    this.setDecorated(false)
    this.setResizable(true)
    this.setKeepAbove(true)
    this.add(this.container)

    /* Event handlers */
    this.on('show', this.onShow)
    this.on('hide', Gtk.mainQuit)
    this.on('delete-event', this.onDelete)
    // this.on('destroy', this.onDestroy)
    this.input.on('key-press-event', this.onKeyPressEvent)
    this.input.on('search-changed', this.update)
  }

  run = (items, meta) => {
    const { dimensions, colors } = meta
    this.input.setText('')
    this.items = items
    this.matches = []
    this.result = null
    this.setTheme(colors)
    this.move(
      dimensions.x + (dimensions.width  - width)  / 2,
      dimensions.y + (dimensions.height - height) / 2,
    )
    this.update()
    this.showAll()
    return this.result
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

  accept = () => {
    this.result = this.itemList?.getSelectedItem()
    this.hide()
  }

  onKeyPressEvent = (event) => {
    if (event.keyval === Gdk.KEY_Escape)
      this.close()
    else if (event.keyval === Gdk.KEY_Return)
      this.accept()
  }

  onShow = () => {
    this.present()
    this.grabFocus()
    // This start the Gtk event loop. It is required to process user events.
    // It doesn't return until you don't need Gtk anymore, usually on window close.
    Gtk.main()
  }

  onDelete = () => {
    this.hide()
    return true
  }

  setTheme(colors) {
    if (!colors || !colors.fg || !colors.bg) {
      return
    }
    if (this.colors && !isEqual(colors, this.colors)) {
      Gtk.StyleContext.removeProviderForScreen(screen, this.provider)
    }
    this.provider = new Gtk.CssProvider()
    this.provider.loadFromData(`
      @define-color fg_color ${colors.fg};
      @define-color bg_color ${colors.bg};

      window, entry.search, viewport, list, row {
        background-color: @bg_color;
      }
    `)
    Gtk.StyleContext.addProviderForScreen(
      screen,
      this.provider,
      GtkStyleProviderPriority.APPLICATION
    )
    this.colors = colors
  }
}

module.exports = ListerWindow


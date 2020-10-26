/*
 * window.js
 */

const gi = require('node-gtk')
const isEqual = require('lodash.isequal')
const activateWindow = require('../helpers/activate-window')

require('./init')

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

const display = Gdk.Display.getDefault()
const screen = display.getDefaultScreen()


const width  = 800
const height = 400

const ID = '__lister__'

class ListerWindow extends Gtk.ApplicationWindow {

  constructor(application) {
    super({
      application,
      title: ID,
      type: Gtk.WindowType.TOPLEVEL,
    })

    /* State */
    this.items = []
    this.matches = []
    this.result = null

    /* Elements */
    this.container = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    this.input = new Gtk.SearchEntry()
    this.scrollWindow = new Gtk.ScrolledWindow()
    this.itemList = null

    /* Build our layout */
    this.container.packStart(this.input,        false, true, 0)
    this.container.packStart(this.scrollWindow, true,  true, 0)

    this.setWmclass(ID, ID)
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
    this.on('focus-out-event', this.onFocusOut)
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

  onShow = () => {
    this.present()
    this.grabFocus()

    setTimeout(() =>
      activateWindow(ID).catch(console.error)
    , 50)

    // This start the Gtk event loop.
    // It is required to process user events.
    // It doesn't return until the window closes.
    Gtk.main()
  }

  onDelete = () => {
    this.hide()
    return true
  }

  onFocusOut = () => {
    this.close()
  }

  onKeyPressEvent = (event) => {
    if (event.keyval === Gdk.KEY_Escape)
      this.close()
    else if (event.keyval === Gdk.KEY_Return)
      this.accept()
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


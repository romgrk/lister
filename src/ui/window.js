/*
 * window.js
 */

const cp = require('child_process')
const util = require('util')
const exec = util.promisify(cp.exec)
const gi = require('node-gtk')
const isEqual = require('lodash.isequal')
const debounce = require('debounce')
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

const { search, asMatches, asItems } = require('../search')
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

    this.update = debounce(this.update, 1)

    /* State */
    this.items = []
    this.matches = []
    this.result = null

    /* Elements */
    this.container = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
    this.input = new Gtk.Entry()
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
    // this.on('focus-out-event', this.onFocusOut)
    // this.on('destroy', this.onDestroy)
    this.input.on('key-press-event', this.onKeyPressEvent)
    // this.input.on('search-changed', this.update)
  }

  run = (meta) => {
    const { dimensions, colors } = meta
    this.input.setText('')
    this.items = []
    this.matches = []
    this.result = null
    this.setTheme(colors)
    this.move(
      dimensions.x + (dimensions.width  - width)  / 2,
      dimensions.y + (dimensions.height - height) / 2,
    )

    console.log('window:exec')
    console.time('exec')
    exec('fd -t f', { cwd: meta.cwd }).then(res => {
      console.log('window:exec:done')
      console.timeEnd('exec')
      const items = res.stdout.split('\n').map(f => ({ text: f }))
      console.log('window:items', [items.length])
      this.addItems(items)
    })

    console.log('window:show-all')
    this.showAll()
    return this.result
  }

  addItems = (items) => {
    this.items = this.items.concat(items)
    this.update()
  }

  update = () => {
    console.timeEnd('window:update')
    const query = this.input.getText()

    if (query === '') {
      this.matches = asMatches(this.items)
      this.renderList()
      return
    }

    let items = this.items

    if (query.startsWith(this.lastQuery) && this.matchesFor === this.lastQuery) {
      items = asItems(this.matches)
    }

    console.log('searching on ', [items.length])
    this.lastQuery = query

    console.time('search')
    search(query, items).then(matches => {
      console.log([query, matches.length])
      console.timeEnd('search')

      this.matches = matches
      this.matchesFor = query

      this.renderList()
    })
    .catch(err => {
      console.error(err)
    })
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

  renderList = () => {
    this.clearList()

    // TODO: we are lying here, we're not showing all
    // items. On large lists, generating that much elements
    // is expensive. We should create a component able to lazy
    // load more items on scroll.
    const displayedMatches = this.matches.slice(0, 30)

    console.time('generate-elements')
    this.itemList = new ItemList(displayedMatches)
    console.timeEnd('generate-elements')
    console.time('show-elements')
    this.scrollWindow.add(this.itemList)
    this.scrollWindow.showAll()
    console.timeEnd('show-elements')
  }

  accept = () => {
    this.result = this.itemList?.getSelectedItem()
    this.hide()
  }

  clear = () => {
    this.clearList()
  }

  clearList = () => {
    const children = this.scrollWindow.getChildren()
    children.forEach(c => this.scrollWindow.remove(c))
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

  // onFocusOut = () => { this.close() }

  onKeyPressEvent = (event) => {
    console.log('window:key')
    console.time('window:update')
    if (event.keyval === Gdk.KEY_Escape)
      this.close()
    else if (event.keyval === Gdk.KEY_Return)
      this.accept()
    else {
      this.update()
    }
  }
}

module.exports = ListerWindow


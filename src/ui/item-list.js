/*
 * item-list.js
 */

const gi = require('node-gtk')
const escapeXML = require('xml-escape')

const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')

const Icons = require('./icons')

const FONT_FAMILY = 'SauceCodePro Nerd Font'
const ICON_FAMILY = FONT_FAMILY

const style = {
  item: (markup, colors) => `<span font_family="${FONT_FAMILY}" weight="bold" size="9000" foreground="${colors.fg}">${markup}</span>`,
  match: (markup) => `<span foreground="#ff4444">${markup}</span>`,
  empty: (markup) => style.item(`<span foreground="#888888">${markup}</span>`),
  icon: (i) => `<span size="9500" font_family="${ICON_FAMILY}" foreground="${i.color}">${i.icon}</span>`,
}

class ItemList extends Gtk.ListBox {
  constructor(items, colors = { fg: '#efefef' }) {
    super()
    for (let i = 0; i < items.length; i++) {
      this.add(new Item(items[i], colors))
    }
    if (items.length === 0)
      this.add(new EmptyItem(colors))
  }

  getSelectedItem() {
    const row = this.getSelectedRow() || this.getRowAtIndex(0)
    return row?.data.item
  }
}

class EmptyItem extends Gtk.ListBoxRow {
  constructor() {
    super()
    const padding = '      '
    this.element = new Gtk.Label()
    this.element.setMarkup(style.empty(padding + 'No match found'))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

class Item extends Gtk.ListBoxRow {
  constructor(m, colors) {
    super()
    this.data = m
    this.element = new Gtk.Label()
    this.element.setMarkup(renderMatch(m, colors))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

function renderMatch(m, colors) {
  const parts = []
  const text      = m.item.text
  const positions = m.positions
  // console.log(positions)

  const filename = m.item.text
  const icon = style.icon(Icons.get(filename))
  const label = style.item(renderLabel(m), colors)

  return `${icon}   ${label}`
}

function renderLabel(m) {
  const parts = []
  const text      = m.item.text
  const positions = m.positions
  // console.log(positions)

  if (!positions)
    return escapeXML(text)

  let lastIndex = 0
  for (let i = 0; i < positions.length; i++) {
    const index = positions[i]

    if (index !== 0 || index === lastIndex + 1) {
      const subtext = escapeXML(text.slice(lastIndex, index))
      parts.push(subtext)
    }

    const subtext = escapeXML(text.slice(index, index + 1))
    parts.push(style.match(subtext))

    lastIndex = index + 1
  }
  if (lastIndex < text.length) {
    const subtext = escapeXML(text.slice(lastIndex))
    parts.push(subtext)
  }

  return parts.join('')
}


module.exports = ItemList

/*
 * item-list.js
 */

const gi = require('node-gtk')
const escapeXML = require('xml-escape')

const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')


const style = {
  item: (markup) => `<span font_family="monospace" weight="bold" size="9000">${markup}</span>`,
  match: (markup) => `<span foreground="#ff4444">${markup}</span>`,
  empty: (markup) => style.item(`<span foreground="#888888">${markup}</span>`),
}

class ItemList extends Gtk.ListBox {
  constructor(items) {
    super()
    for (let i = 0; i < items.length; i++) {
      this.add(new Item(items[i]))
    }
    if (items.length === 0)
      this.add(new EmptyItem())
  }

  getSelectedItem() {
    const row = this.getSelectedRow() || this.getRowAtIndex(0)
    return row?.data.item
  }
}

class EmptyItem extends Gtk.ListBoxRow {
  constructor() {
    super()
    this.element = new Gtk.Label()
    this.element.setMarkup(style.empty('No match found'))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

class Item extends Gtk.ListBoxRow {
  constructor(m) {
    super()
    this.data = m
    this.element = new Gtk.Label()
    this.element.setMarkup(renderMatch(m))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

function renderMatch(m) {
  const parts = []
  const text      = m.item.text
  const positions = m.positions
  // console.log(positions)

  if (!positions)
    return style.item(escapeXML(text))

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

  return style.item(parts.join(''))
}


module.exports = ItemList

/*
 * item-list.js
 */

const gi = require('node-gtk')
const escapeXML = require('xml-escape')

const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')


class ItemList extends Gtk.ListBox {
  constructor(items) {
    super()
    for (let i = 0; i < items.length; i++) {
      this.add(new Item(items[i]))
    }
  }

  getSelectedItem() {
    const row = this.getSelectedRow() || this.getRowAtIndex(0)
    return row?.data.item
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
    return styleGlobal(escapeXML(text))

  let lastIndex = 0
  for (let i = 0; i < positions.length; i++) {
    const index = positions[i]

    if (index !== 0 || index === lastIndex + 1) {
      const subtext = escapeXML(text.slice(lastIndex, index))
      parts.push(subtext)
    }

    const subtext = escapeXML(text.slice(index, index + 1))
    parts.push(styleMatch(subtext))

    lastIndex = index + 1
  }
  if (lastIndex < text.length) {
    const subtext = escapeXML(text.slice(lastIndex))
    parts.push(subtext)
  }

  return styleGlobal(parts.join(''))
}

function styleGlobal(markup) {
  return `<span font_family="monospace" weight="bold" size="9000">${markup}</span>`
}

function styleMatch(markup) {
  return `<span foreground="#ff4444">${markup}</span>`
}


module.exports = ItemList

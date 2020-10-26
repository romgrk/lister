
# lister (experimental, not usable yet)

To be notified when it's ready, set your watch status to Releases Only.

![lister](./static/lister.gif)

This is a fuzzy picker interface that can be opened from any other 
application.

### Requirements

The current implementation relies on a lot of things. Cross-platformly
opening a window over the active window is not an easy thing to do,
but I will remove dependencies as I find solutions.

 - Linux & X11
 - nodejs
 - xdotool
 - xwininfo
 - xprop
 - fd

### How

The server always runs in the background. This allows to reduce the
startup delay.

```bash
node src/index.js
```

Then, the client can send requests.

```bash
~/path/to/lister/bin/lister
```

For now, this is all highly experimental. The client sends queries
by running `fd -t f` in the current directory to the server and that's
it.

### Neovim

```vim
Plug 'romgrk/lister', { 'do': 'npm install' }
```

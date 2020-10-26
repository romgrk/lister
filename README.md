
# lister (experimental, not usable yet)

To be notified when it's ready, set your watch status to Releases Only.

![lister](./static/lister.gif)

This is a fuzzy picker interface that can be opened from any other 
application.

#### How

The server always runs in the background. This allows to reduce the
startup delay.

```bash
node src/index.js
```

Then, the client can send requests.

```bash
~/path/to/filer/bin/lister
```

For now, this is all highly experimental. The client sends queries
by running `fd -t f` in the current directory to the server and that's
it.

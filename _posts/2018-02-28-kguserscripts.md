---
title: Kitten Game userscripts
layout: scriptpost
date: 2018-02-28 15:30:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
---

Most of the published code assumes that Kittens Game has finished
loading and is running properly before the functions are pasted into
the console (or loaded in other ways).  In many cases it won't matter
because the code is fairly self-contained, but in others trying to
initialize the scripts before the page is ready will result in errors
because it is looking for data that doesn't exist.

Kittens Game uses two variables to store state information, `game` and
`gamePage`, from what I've seen they are equivalent and I typically
use the former for actual calculations.  The latter however is not
available until the page has finished loading so it will guarantee
assets are in place.

Waiting for the variable to be defined ensures that everything is
ready and won't error out.

```js
function run () {
    // Scripts go here
    ...
}

function start () {
    if (typeof gamePage != 'undefined) {
        run()
    } else {
        // Try every second to initialize
        setTimeout(start, 1000)
    }
}

start()
```

---
title: KittensGame TabSwitch keybindings
layout: scriptpost
date: 2018-02-19 12:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-tabswitch.js
---

When playing KittensGame I frequently find myself having to switch game tabs
constantly while trying to build.  In particular during the titanium build-out
phase I end up needing to switch from <span style="text-decoration:
underline">T</span>rading with Zebras back to the <span style="text-decoration:
underline">B</span>onfire to build more Reactors, Accelerators or Factories.

This came up on Discord last week and I decided to look into what it
would take to implement this.  I'm learning Javascript as I go so I
knew there would likely be suboptimal designs but it was not nearly as
hard as I expected.

First I figured out what structure I'd want for identifying event and
action.  From working with Lisp and Powershell I'd wanted to go with
an associative list of `Key -> Action` or `Action -> Key` but couldn't
figure out how to make this work in Javascript.  Probably for the best
since an array of objects worked out quite well and is easily
extensible.

```js
{
    name: 'Tab to switch to',
    key: 'Key',    // Must capitalize letters to match event.key if
                   // Shift is pressed
    shift: true,   // Shift modifier prevents accidental switching
    alt: false,    // Alt and Control false to not interact with
    control: false // browser bindings.
}
```

With that in place it was easy to create the mappings for the commonly
used tabs.  Use the initial of the tab as the keybinding, with any
duplicates moving to the next letter (in this case S<span
style="text-decoration: underline">P</span>ace and T<span
style="text-decoration: underline">I</span>me).

Then a function to identify which of the keybindings to act on based
on events and recreate the existing tab switching functionality to
jump to the new tab and render it.

```js
// tablist is the variable containing the keybindings
function switchTab(event) {
    var newTab = keybinds.find(x =>
        x.key === event.key &&
        x.shift == event.shiftKey &&
        x.alt == event.altKey &&
        x.control == event.ctrlKey)
    if (newTab && newTab.name!= activeTabId) {
        console.log('Switching to: ' + newTab.name)
        game.ui.activeTabId = newTab.name
        game.ui.render()
    }
}
```

Adding this as a `keyup` event listener let it trigger on keystrokes,
which provided the last piece needed.

While testing it I remembered the other issue I constantly have had,
closing the Options and Export dialogs by hitting `Escape` from habit
and seeing nothing happen.  By defining a new `action:` property in
the mapping and setting it to trigger the click action on the Options
page I fixed the first half of that.

```js
// tablist is the variable containing the keybindings
function switchTab(event) {
    var newTab = keybinds.find(x =>
        x.key === event.key &&
        x.shift == event.shiftKey &&
        x.alt == event.altKey &&
        x.control == event.ctrlKey)
    if (newTab && newTab.name!= activeTabId) {
        if (newTab.action) {
            newTab.action()
        } else {
            console.log('Switching to: ' + newTab.name)
            game.ui.activeTabId = newTab.name
            game.ui.render()
        }
    }
}
```

Now add in a few other new features with lowercase bindings to
distinguish from tab switching and the naming needs to be slightly
updated:

- <span style="text-decoration:underline">h</span>unt
- <span style="text-decoration:underline">p</span>raise
- <span style="text-decoration:underline">o</span>bserve

Finally I realized that rather than target the close button on
options, just use jQuery to target the last visible `.dialog` div and
hide it.

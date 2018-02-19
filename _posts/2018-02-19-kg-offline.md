---
title: KittensGame Offline Progression Toggle
layout: scriptpost
date: 2018-02-19 12:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-offlinetoggle.js
---

Offline progression in KittensGame currently has a slight quirk to it
that can be taken advantage of by toggling Offline Progression when
playing on the web.<!-- more -->

On the mobile version Offline Progression works by calculating system
time since the game last updated and then fast forwarding to make up
at least a portion of the progress that should have been made.  This
makes up for the lack of multi-tasking with background apps and
closing apps when not actively looking at them.

On the web the experimental Offline Progression calculates time since
the last time it was *activated*.  This should work in conjunction
with closing the tab or pausing the game, however it continues to
accumulate offline time while the game is running if Offline
Progression is disabled.

The normal process would be to open options, click on offline
progression and then click on it a second time to turn it back off
since it takes effect almost immediately.  However this is ultimately
inefficient when it maximizes roughly every 8 hours.  Setting up an
interval to trigger offline progression every 8 hours would provide
close to optimal progress, reducing the interval slightly would give
the added benefit of not missing any extra production due to lag, but
the difference should be minimal.

```js
var offlineHours = 8;
var hours = 60*60*1000; // milliseconds to hours

var getOfflineProduction = setInterval(runOfflineUpdate, offlineHours*hours);

// Disable with
// clearInterval(getOfflineProduction)
```

Offline Progress is considered **redshift** in the game code so
toggling it on and off becomes

```js
function runOfflineUpdate () {
    game.opts.enableRedshift = true
    game.time.calculateRedshift()
    game.ops.enableRedshift = false
}
```

The extra function call between turning it on and off is to ensure
that it actually is calculated.  If it were turned on and off in a
span of time shorter than a single tick then nothing would be gained.
Forcibly calling `calculateRedshift()` forces the game to add the
production.

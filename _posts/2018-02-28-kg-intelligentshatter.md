---
title: Intelligent Shatter Engine
layout: scriptpost
date: 2018-02-28 11:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-intellishatter.js
---

A semi frequent topic on Discord is shatter engines and ensuring you
don't overheat while still producing as much as you can through
TimeCrystal mechanics.  The actual calculations to determine
profitability of shattering through Resource Retrieval and Blazars
will be saved for a later post, this one will look at implementing a
shatter engine that runs at an optimal pace without having to monitor
it constantly.

There are four elements needed to keep the shatter engine going, the
third of which will need to be addressed at a later date.

1. Shattering Time Crystals as quickly as heat dissipation allows
2. Sacrificing Alicorns when they reach 25 to ensure crystal creation
3. Trading with Leviathans to keep up a supply of Time Crystals and to
   avoid capping unobtanium
4. A timer to check or perform these actions

### Timing for shattering

Shattering at an optimal rate means just as quickly as you can remove
10 heat from your furnace.  Since the goal is to never go into
overheat there is no reason to shatter more than 1 crystal at a time.
You'll remain at minimal heat and can always manually shatter to get a
boost if there is a reason.

```js
// Use per-tick calculations.  Could be useful at high chrono furnace
// levels to optimize even further
var shatterPerTick = false;

var shatterPadding = 0; // Addition seconds to delay shatter

function getTimePer10Heat() {
    return Math.ceil(Math.abs(10 / ((shatterPerTick ? 1 : 5) *
                                    game.getEffect('heatPerTick')))) +
        (shatterPadding * (shatterPerTick ? 5 : 1))
}
```

The shatter button itself is hidden on the timeTab and isn't available
initially because it needs to be rendered.  Previous solutions
suggested using a `... children[0].children[0] ... click()` construct but
*bloodrizer* pointed at using the built in classes and controller to
identify the actual `doShatterAmt()` function.  A bit of prodding and
working out difference between manually generating a small segment vs
how the page itself loads and the function was available.

Building a new widget was simpler than using the rendered one because
of component nesting.  `Combust TC` is nested inside of a
chronoforgePanel (`cfPanel`) which is why there were the nested
children.  Option name had to be used because unlike every other
object on the panel, `Combust TC` does not have an id property, but
there is no guarantee that will not be changed.

```js
function createShatterWidget () {
    var shatterWidget = new classes.ui.ChronoforgeWgt(game),
        shatterButton = shatterWidget.children.find(
            button => button.opts.name === 'Combust TC'
        );

    shatterButton.model = Object.assign({},shatterButton.opts);
    shatterButton.model.options = Object.assign({},shatterButton.opts)
    shatterButton.model.enabled = true;
    return shatterButton
}

var shatterButton = createShatterWidget()
```

The actual shatter function keeps track of the counter state so that
it can shatter as required.  The dojo controller functions need access
to the model (sibling to the controller) as well as an event and
callback.  `doShatterAmt` also needs an amount to shatter, which
defaults to 5 if not specified.  Since we aren't monitoring the
engine, the callback and event aren't needed, only the model and quantity.

```js
var counter = 1;
function shatterTCTime () {
    if (counter % getTimePer10Heat() == 0) {
        shatterButton.controller.doShatterAmt(
            shatterButton.model, false, () => { }, 1
        )
        counter = 1
    } else {
        counter++
    }
}
```

Shattering will only occur if there are enough resources to do so
successfully.

### Alicorn sacrificing

Alicorn sacrificing is a very similar button to the one used for Time
Crystals however it is not in a nested container.  Calling the
existing controller is simpler than ensuring all options are generated
in the models.

```js
// Force rendering of the religionTab in case it isn't done yet
game.religionTab.render()
var alicornButton = game.religionTab.sacrificeAlicornsBtn

function sacrificeAlicorns () {
    alicornButton.controller.sacrificeAll(
        alicornButton.model, false, () => { }
    )
}
```

### Leviathan Trading

Shatter Engines are only efficient as long as Leviathans are providing
Time Crystals.  Trading with them allows the engine to continue
running consistently.

Luckily there is a `tradeAll(<race>)` function that intelligently
trades for what is available and does not need monitoring to ensure
there are resources available.

```js
function tradeLeviathans () {
    var leviRace = game.diplomacy.races.find(
        race => race.name === 'leviathans'
    )
    game.diplomacy.tradeAll(leviRace)
}
```
### Shatter Timer

Since there are multiple functions needing to be run, a wrapper to
call them in order is needed.  Also there is no reason to try and run
the shatter engine when there are no time crystals, so only allow it
to be triggered if the resource is unlocked.

```js
function automateShatter () {
    sacrificeAlicorns()
    tradeLeviathans()
    shatterTCTime()
}

if (gamePage.resPool.get('timeCrystal').unlocked) {
    var shatterInterval = setInterval(automateShatter,
                                      shatterPerTick ? 250 : 1000)
} else {
    console.log("Time Crystals not available")
}
// clearInterval(shatterInterval)
```

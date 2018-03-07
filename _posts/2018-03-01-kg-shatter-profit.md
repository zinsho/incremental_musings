---
title: Calculating Shatter Profitability
layout: scriptpost
date: 2018-03-01 07:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-shatterProfits.js
---

As mentioned in my [previous post]({{site.baseurl}}{% post_url
2018-02-28-kg-intelligentshatter %}), calculating shattering
profitability is a separate process from implementing the shatter
engine itself.  They can be paired together to ensure the engine is
running when profitable and stops if you would run out of TC due to
the **Cycle** or **Dark Future**.

Profits also need to account for idle production since there is time
spent between shatters.  It does not account for Alicorn rift chances
since as shatter speed increases, chances for rifts to even occur will
decrease.

### Unobtainium per Shatter

Unobtainium per shatter is simply how much unobtainium is returned
every year due to `Resource Retrieval`.  That ratio will be passed in
from the parent function so it will always be up to date.

```js
function getUnobtPerShatter(ratio, delay) {
    var n = 'unobtainium',
        unobt = game.resPool.get(n),
        unProd = game.getResourcePerTick(n) * 5 *
            (game.time.isAccelerated ? 1.5 : 1),
        unYr = unProd * 800,
        unIdle = unProd * (shatterPerTick ? delay/5 : delay)
        unShatter = unYr * ratio + unIdle

    // return per shatter or max
    return Math.min(unShatter, unobt.maxValue)
}
```

### Alicorns per Shatter

Unfortunately shattering essentially eliminates alicorn income because
are skipping years rather than triggering per tick/day effects.  This
does mean calculations can omit the chance even though at low values
of chronofurnaces you will still be gaining extra alicorns.

```js
function getAlicornPerShatter(ratio, delay) {
    var n = 'alicorn',
        aliProd = game.getResourcePerTick(n) * 5 *
            (game.time.isAccelerated ? 1.5 : 1),
        aliYr = aliProd * 800,
        aliIdle = aliProd * (shatterPerTick ? delay/5 : delay)

    return aliYr * ratio + aliIdle
}
```

### Time Crystals per Shatter

Time Crystals per shatter converts from resources per year to Time
Crystals per year by assuming partial income.  This does require a
certain amount of padding on initial crystals to ensure that the
engine does not stall, but once started it should not need to stop
since the purchase will cover any future expenditures.

```js
function getTCPerTrade() {
    var leviRace = game.diplomacy.races.find(
        race => race.name === 'leviathans')

    var ratio = game.diplomacy.getTradeRatio(),
        tc = leviRace.sells.find(
            res => res.name === 'timeCrystal'),
        amt = tc.value - (tc.value * (tc.delta / 2))

    return amt * (1 + ratio) * (1 + (0.02 * leviRace.energy))
}

function getTCPerShatter() {
    var rr = game.getEffect('shatterTCGain') *
        (1 + game.getEffect('rrRatio'))

    var unobt = getUnobtPerShatter(rr),
        tcPerUnobt = getTCPerTrade() / 5000,
        ali = getAlicornPerShatter(rr),
        tcPerAli = (1 + game.getEffect('tcRefineRatio')) / 25,
        heatChallenge = game.challenges.getChallenge("1000Years").researched,
        furnaceBoost = (heatChallenge ? 5 : 10) / 100

    return (unobt * tcPerUnobt + ali * tcPerAli) * (1 + furnaceBoost)
}
```

### Time Crystal Profitability

Because of `Dark Future` and possible overheat situations (if manually
shattering), price per shatter will not always be 1.  Leverage the
internal price calculation to get the actual cost and determine profit
relative to it.

```js
// Use shatterButton from intellishatter if present rather than
// risk possible UI changes
var shatterPerTick = false
var shatterPadding = 0 // Additional seconds to delay shatter

function getTimePer10Heat() {
    var heat = game.challenges.getChallenge('1000Years').researched,
        heat = heat ? 5 : 10
    return Math.ceil(Math.abs(heat / ((shatterPerTick ? 1 : 5) *
                                    game.getEffect('heatPerTick')))) +
        (shatterPadding * (shatterPerTick ? 5 : 1))
}

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


function getTCProfitability() {
    var inTC = getTCPerShatter(),
        outTC = shatterButton.controller
            .getPrices(shatterButton.model)
            .find(x => x.name === 'timeCrystal').val
    return inTC - outTC
}
```

Positive values given by `getTCProfitability()` mean profit, negative
values are the cost in TC every time you shatter.

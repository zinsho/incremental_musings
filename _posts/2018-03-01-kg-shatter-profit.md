---
title: Calculating Shatter Profitability
layout: scriptpost
date: 2018-02-28 11:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-shatterProfits.js
---

As mentioned in my [previous
post](./2018-02-28-kg-intelligentshatter.md), calculating shattering
profitability is a separate process from implementing the shatter
engine itself.  They can be paired together to ensure the engine is
running when profitable and stops if you would run out of TC due to
the **Cycle** or **Dark Future**.

### Unobtainium per Shatter

Unobtainium per shatter is simply how much unobtainium is returned
every year due to `Resource Retrieval`.  That ratio will be passed in
from the parent function so it will always be up to date.

```js
function getUnobtPerShatter(ratio) {
    var n = 'unobtainium',
        unobt = game.resPool.get(n),
        unYr = game.getResourcePerTick(n) * 5 * 800,
        unShatter = unYr * ratio

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
function getAlicornPerShatter(ratio) {
    var n = 'alicorn',
        aliYr = game.getResourcePerTick(n) * 5 * 800

    return aliYr * ratio
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
function getTCProfitability() {
    // Use shatterButton from intellishatter if present rather than
    // risk possible UI changes
    if (typeof shatterButton == 'undefined') {
        game.timeTab.render()
        var shatterButton = game.timeTab.cfPanel.children.map(
            x => x.children.find(x => x.model.name === 'Combust TC'))[0]
    }
    var inTC = getTCPerShatter(),
        outTC = shatterButton.controller
            .getPrices(shatterButton.model)
            .find(x => x.name === 'timeCrystal').val
    return inTC - outTC
}
```

Positive values given by `getTCProfitability()` mean profit, negative
values are the cost in TC every time you shatter.

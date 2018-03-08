var shatterPerTick = false
var shatterPadding = 0 // Additional seconds to delay shatter

function getTimePer10Heat(furnaces = 0) {
    var heat = game.challenges.getChallenge('1000Years').researched,
        heat = heat ? 5 : 10,
        heatDown = game.time.getCFU('blastFurnace').effects.heatPerTick,
        heatPerTick = heatDown * furnaces - 0.01
    return Math.ceil(Math.abs(heat / ((shatterPerTick ? 1 : 5) *
                                    heatPerTick))) +
        (shatterPadding * (shatterPerTick ? 5 : 1))
}

function createShatterWidget () {
    var shatterWidget = new classes.ui.ChronoforgeWgt(game),
        shatterButton = shatterWidget.children.find(
            button => button.opts.name === 'Combust TC'
        );

    shatterWidget.render()
    return shatterButton
}

var shatterButton = createShatterWidget()

function getTCProfitability() {
    var currFurnace = game.time.getCFU('blastFurnace').on
    var inTC = getTCPerShatter(currFurnace),
        outTC = shatterButton.controller
            .getPrices(shatterButton.model)
            .find(x => x.name === 'timeCrystal').val
    var curr = inTC - outTC,
        next = getTCPerShatter(currFurnace +1) - outTC
    return "Current: "+curr+"\nNext Furnace: "+next
}

function getTCPerShatter(furnace) {
    var rr = game.getEffect('shatterTCGain') *
        (1 + game.getEffect('rrRatio')),
        delay = getTimePer10Heat(furnace)
    var unobt = getUnobtPerShatter(rr, delay),
        tcPerUnobt = getTCPerTrade() / 5000,
        ali = getAlicornPerShatter(rr, delay),
        tcPerAli = (1 + game.getEffect('tcRefineRatio')) / 25,
        heatChallenge = game.challenges.getChallenge("1000Years").researched,
        furnaceBoost = (heatChallenge ? 5 : 10) / 100

    return (unobt * tcPerUnobt + ali * tcPerAli) * (1 + furnaceBoost)
}

function getUnobtPerShatter(ratio, delay) {
    var n = 'unobtainium',
        unobt = game.resPool.get(n),
        unProd = game.getResourcePerTick(n) * 5 * (game.time.isAccelerated ? 1.5 : 1),
        unYr = unProd * 800,
        unIdle = unProd * (shatterPerTick ? delay/5 : delay)
        unShatter = unYr * ratio + unIdle

    // return per shatter or max
    return Math.min(unShatter, unobt.maxValue)
}

function getAlicornPerShatter(ratio, delay) {
    var n = 'alicorn',
        aliProd = game.getResourcePerTick(n) * 5 * (game.time.isAccelerated ? 1.5 : 1),
        aliYr = aliProd * 800,
        aliIdle = aliProd * (shatterPerTick ? delay/5 : delay)

    return aliYr * ratio + aliIdle
}

function getTCPerTrade() {
    var leviRace = game.diplomacy.races.find(
        race => race.name === 'leviathans')

    var ratio = game.diplomacy.getTradeRatio(),
        tc = leviRace.sells.find(
            res => res.name === 'timeCrystal'),
        amt = (tc.value - (tc.value * (tc.delta / 2))) * tc.chance/100

    return amt * (1 + ratio) * (1 + (0.02 * leviRace.energy))
}

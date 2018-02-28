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

function getUnobtPerShatter(ratio) {
    var n = 'unobtainium',
        unobt = game.resPool.get(n),
        unYr = game.getResourcePerTick(n) * 5 * 800,
        unShatter = unYr * ratio

    // return per shatter or max
    return Math.min(unShatter, unobt.maxValue)
}

function getAlicornPerShatter(ratio) {
    var n = 'alicorn',
        aliYr = game.getResourcePerTick(n) * 5 * 800

    return aliYr * ratio
}

function getTCPerTrade() {
    var leviRace = game.diplomacy.races.find(
        race => race.name === 'leviathans')

    var ratio = game.diplomacy.getTradeRatio(),
        tc = leviRace.sells.find(
            res => res.name === 'timeCrystal'),
        amt = tc.value - (tc.value * (tc.delta / 2))

    return amt * (1 + ratio) * (1 + (0.02 * leviRace.energy))
}

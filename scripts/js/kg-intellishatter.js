// ** Crystal Shattering
var shatterPerTick = false
var shatterPadding = 0 // Add extra seconds to give leeway before combusting (if reason to do so)

function getTimePer10Heat() {
    return Math.ceil(Math.abs(10 / ((shatterPerTick ? 1 : 5) *
                                    game.getEffect('heatPerTick')))) +
        (shatterPadding * (shatterPerTick ? 5 : 1))
}

function createShatterWidget () {
    var shatterWidget = new classes.ui.ChronoforgeWgt(game),
        shatterButton = shatterWidget.children.find(x => x.opts.name === 'Combust TC');

    shatterButton.model = Object.assign({},shatterButton.opts);
    shatterButton.model.options = Object.assign({},shatterButton.opts);
    shatterButton.model.enabled = true;
    return shatterButton
}

var shatterButton = createShatterWidget()

var counter = 1 // Start at 1 for increment
function shatterTCTime () {
    if (counter % getTimePer10Heat() == 0) {
        shatterButton.controller.doShatterAmt(shatterButton.model, false, () => { }, 1)
        counter = 1
    } else {
        counter++
    }
}

// ** Alicorns
// Load religion buttons into memory
game.religionTab.render()
var alicornButton = game.religionTab.sacrificeAlicornsBtn

function sacrificeAlicorns () {
    alicornButton.controller.sacrificeAll(alicornButton.model, false, () => { })
}

// ** Leviathans
function tradeLeviathans () {
    var leviRace = game.diplomacy.races.find(race => race.name === 'leviathans')
    game.diplomacy.tradeAll(leviRace)
}

// ** Timer
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

// ** Crystal Shattering
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

var slowRedmoon = true
var counter = 1 // Start at 1 for increment
function shatterTCTime () {
    if (slowRedmoon && game.calendar.cycle == 5) {
        return
    }
    var furnaces = game.time.getCFU('blastFurnace').on
    if (counter % getTimePer10Heat(furnaces) == 0) {
        shatterButton.controller.doShatterAmt(
            shatterButton.model, false, () => { }, 1
        )
        counter = 1
    } else {
        counter++
    }
}

// ** Alicorns
// Load religion buttons into memory
game.religionTab.render()
var model = Object.assign({}, game.religionTab.sacrificeAlicornsBtn.model)

var alicornButton = new classes.ui.religion.SacrificeBtn(
    {
        controller: new classes.ui.religion.SacrificeAlicornsBtnController(
            game
        ),
        prices: model.prices},
    game
)

function sacrificeAlicorns () {
    alicornButton.render()
    alicornButton.controller.sacrificeAll(
        alicornButton.model,
        false,
        () => {}
    )
}

// ** Leviathans
function tradeLeviathans () {
    var leviRace = game.diplomacy.races.find(
        race => race.name === 'leviathans'
    )
    if (leviRace.unlocked) {
        game.diplomacy.tradeAll(leviRace)
    }
}

// ** Timer
function automateShatter () {
    sacrificeAlicorns()
    tradeLeviathans()
    shatterTCTime()
}

if (gamePage.resPool.get('timeCrystal').unlocked) {
    var shatterInterval = setInterval(automateShatter,
                                      shatterPerTick ? 200 : 1000)
} else {
    console.log("Time Crystals not available")
}
// clearInterval(shatterInterval)

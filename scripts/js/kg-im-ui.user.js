// ==UserScript==
// @name     Incremental_Musings_KG_UI
// @author   Zinsho Lexagen
// @version  1
// @include  file://*kitten-game*
// @require  https://cdn.jsdelivr.net/npm/vue
// @require  https://unpkg.com/vuex
// @grant    GM_addStyle
// @grant    unsafeWindow
// ==/UserScript==

// Get the div containing the game itself to load into then create the
// appropriate container for Vue
var gameDiv = document.getElementById("game");
if (gameDiv) {
    var vueDiv = gameDiv.appendChild(document.createElement("div"));
    vueDiv.setAttribute("id","im-scripts");
    // Use Column to locate it properly in the UI
    vueDiv.setAttribute("class",'column');
    // Force docking to the right
    vueDiv.setAttribute("style", "position: fixed; right: 0;");
}

// local storage value name
var lcName = 'kg-im-ui'

// test localstorage
if (typeof localStorage !== 'undefined') {
    try {
        localStorage.setItem('feature_test', 'yes');
        if (localStorage.getItem('feature_test') === 'yes') {
            localStorage.removeItem('feature_test');
            // localStorage is enabled
            function savePrefs (prefs) {
                localStorage.setItem(lcName,JSON.stringify(prefs))
            }
            function loadPrefs () {
                return JSON.parse(localStorage.getItem(lcName))
            }
        } else {
            function savePrefs (prefs) {
                return null
            }
            function loadPrefs () {
                return null
            }
            // localStorage is disabled
        }
    } catch(e) {
        // localStorage is disabled
        function savePrefs (prefs) {
            return null
        }
        function loadPrefs () {
            return null
        }
    }
} else {
    // localStorage is not available
    function savePrefs (prefs) {
        return null
    }
    function loadPrefs () {
        return null
    }
}

// Will be called at end of script to ensure game is ready for the
// components to be inserted
function checkLoaded () {
    console.log("Checking that game has loaded before continuing");
    // gamePage is created once game is loaded
    if (typeof gamePage != 'undefined') {
        $('#im-scripts').append('<sb-container></sb-container>')
        $('body').append(imTemplates);
        var imScripts = new Vue ({
            el: "#im-scripts",
            store,
            created: function () {
                console.log('Initializing Vue')
                this.$store.dispatch('init',{
                    state: game
                })
            }
        })
        store.watch(
            () => store.getters.getPrefs,
            prefs => savePrefs(prefs),
            {deep: true}
        )
        unsafeWindow.vue = imScripts

    } else {
        setTimeout(checkLoaded,1000)
    }
}

var preferences = {
    state: {
        currentTab: "calculations",
        sbOpen: true,
        shatterPerTick: false,
        shatterPadding: 0,
    },
    getters: {
        getPrefs: (state) => {
            return state
        },
        getTab: (state) => {
            return state.currentTab
        },
        getSBOpen: (state) => {
            return state.sbOpen
        },
        getShatterPerTick: (state) => {
            return state.shatterPerTick
        },
        getShatterPadding: (state) => {
            return state.shatterPadding
        }
    },
    mutations: {
        importPrefs (state) {
            var toLoad = loadPrefs()

            if (toLoad) {
                Object.entries(toLoad).forEach(prop => {
                    var key = prop[0],
                        val = prop[1]
                    state[key] = val
                })
            }
        },
        toggleTab (state, payload) {
            if (!state.sbOpen) {
                state.sbOpen = true
            }
            state.currentTab = payload;
        },
        closeSidebar (state) {
            state.sbOpen = false
        }
    },
    actions: {
        init ({commit}) {
            commit('importPrefs')
        }
    }
}

var scripts = {}

var utilities = {}

var calculations = {
    state: {
        test: preferences.test
    },
    getters: {
        getNextSMR: (state, getters) => {
            function getSMR(steam, mag, reactor) {
                return (1 + (mag * (0.02) * (1 + (0.15 * steam)))) *
                    (1 + (0.05 * reactor))
            }
            var steam   = getters.getBuilding('steamworks'),
                magneto = getters.getBuilding('magneto'),
                reactor = getters.getBuilding('reactor'),
                steamCount = steam.unlocked ? steam.on : 0,
                magCount   = magneto.unlocked ? magneto.on : 0,
                reactCount = reactor.unlocked ? reactor.on : 0;

            var curr = getSMR(steamCount,magCount,reactCount),
                nextSteam = getSMR(steam.unlocked ? steamCount + 1 : 0,
                                   magneto.unlocked ? magCount : 0,
                                   reactor.unlocked ? reactCount : 0 ) - curr,
                nextMagn = getSMR(steam.unlocked ? steamCount : 0,
                                  magneto.unlocked ? magCount + 1 : 0,
                                  reactor.unlocked ? reactCount : 0 ) - curr,
                nextReact = getSMR(steam.unlocked ? steamCount : 0,
                                   magneto.unlocked ? magCount : 0,
                                   reactor.unlocked ? reactCount + 1 : 0 ) - curr,
                arr = [nextSteam, nextMagn, nextReact],
                max = Math.max(...arr),
                index = arr.indexOf(max),
                name = ['Steamworks','Magneto','Reactor'][index];

            return [
                {
                    building: 'Steamworks',
                    increase: nextSteam,
                    count: steamCount,
                    enabled: steam.unlocked,
                    isBold: name === 'Steamworks'
                },
                {
                    building: 'Magneto',
                    increase: nextMagn,
                    count: magCount,
                    enabled: magneto.unlocked,
                    isBold: name === 'Magneto'
                },
                {
                    building: 'Reactor',
                    increase: nextReact,
                    count: reactCount,
                    enabled: reactor.unlocked,
                    isBold: name === 'Reactor'
                }
            ]
        },
        chartsPerSecond: (state, getters) => {
            var scChance = getters.getEffect('starEventChance'),
                timeRatio = getters.getEffect('timeRatio'),
                haveAstromancy = getters.getPerk('astromancy').unlocked,
                haveChronomancy = getters.getPerk('chronomancy').unlocked;

            var chanceRatio = (haveChronomancy ? 1.1 : 1) *
                    (1 + (timeRatio * 0.25)),
                varChance = (25 + (scChance * 10000)) * (haveAstromancy ? 2 : 1),
                chancePerSecond = chanceRatio * varChance / 10000 / 2,
                chartsPerSecond = Math.min(0.5, chancePerSecond)
            return chartsPerSecond
        },
        getShatterInterval: (state, getters, root) => {
            return furnaces => {
                var heat = getters.getChallenge('1000Years').researched,
                    heat = heat ? 5 : 10,
                    heatDown = getters.getCFU('blastFurnace').effects.heatPerTick,
                    heatPerTick = heatDown * furnaces - 0.01,
                    perTick = getters.getShatterPerTick,
                    padding = getters.getShatterPadding
                return Math.ceil(
                    Math.abs(heat / ((perTick ? 1 : 5) * heatPerTick))) +
                    (padding * (perTick ? 5 : 1))
            }
        },
        getRRRatio: (state, getters, root) => {
            return getters.getEffect('shatterTCGain') *
                (1 + getters.getEffect('rrRatio'))
        },
        getTCPerTrade: (state, getters, root) => {
            var leviRace = getters.getRace('leviathans')
            var ratio = game.diplomacy.getTradeRatio(),
                tc = leviRace.sells.find(
                    res => res.name === 'timeCrystal'),
                amt = (tc.value - (tc.value * (tc.delta /2))) * tc.chance/100

            return amt * (1+ratio) * (1 + (0.02 * leviRace.energy))
        },
        getAlicornPerShatter: (state, getters, root) => {
            return obj => {
                var furnaces = obj.furnaces,
                    withProd = obj.withProd
                var name = 'alicorn',
                    accel = root.gameState.time.isAccelerated ? 1.5 : 1,
                    aliProd = getters.getResPerTick(name) * 5 * accel,
                    aliYr = aliProd * 800,
                    perTick = getters.getShatterPerTick,
                    delay = getters.getShatterInterval(furnaces),
                    aliIdle = aliProd * (perTick ? delay / 5 : delay),
                    aliShatter = aliYr * getters.getRRRatio
                if (withProd) {
                    aliShatter += aliIdle
                }
                return aliShatter
            }
        },
        getUnobtPerShatter: (state, getters, root) => {
            return obj => {
                var furnaces = obj.furnaces,
                    withProd = obj.withProd
                var name = 'unobtainium',
                    accel = root.gameState.time.isAccelerated ? 1.5 : 1,
                    perTick = getters.getShatterPerTick,
                    delay = getters.getShatterInterval(furnaces),
                    unobt = getters.getResPool(name),
                    unProd = getters.getResPerTick(name) * 5 * accel,
                    unYr = unProd * 800,
                    unIdle = unProd * (perTick ? delay/5 : delay),
                    unShatter = unYr * getters.getRRRatio
                if (withProd) {
                    unShatter += unIdle
                }
                return Math.min(unShatter, unobt.maxValue)
            }
        },
        getTCPerShatter: (state, getters, root) => {
            return obj => {
                var unobt = getters.getUnobtPerShatter(obj),
                    tcPerUnobt = getters.getTCPerTrade / 5000,
                    ali = getters.getAlicornPerShatter(obj),
                    tcPerAli = (1 + getters.getEffect('tcRefineRatio'))/25,
                    heat = getters.getChallenge('1000Years').researched,
                    furnaceBoost = (heat ? 5 : 10) / 100

                return (unobt * tcPerUnobt + ali * tcPerAli) *
                    (1 + furnaceBoost)
            }
        },
        getShatterProfit: (state, getters, root) => {
            return obj => {
                var withProd = obj.withProd,
                    next = obj.next,
                    sendObj = {
                        furnaces: getters.getCFU('blastFurnace').on,
                        withProd: withProd
                    }
                if (next) {
                    sendObj.furnaces += 1
                }
                var inTC = getters.getTCPerShatter(sendObj),
                    shatter = root.controllers.shatterButton
                    outTC = shatter.controller.getPrices(shatter.model)
                        .find(x => x.name === 'timeCrystal').val
                return inTC - outTC
            }
        }
    }
}

var controllers = {
    state: {
        shatterButton: null,
        alicornButton: null
    },
    mutations: {
        renderAlicorns: function (state) {
            console.log("Alicorns")
            var aliModel = Object.assign(
                {},
                game.religionTab.sacrificeAlicornsBtn.model
            )

            state.alicornButton = new classes.ui.religion.SacrificeBtn(
                {
                    controller: new classes.ui.religion.SacrificeAlicornsBtnController(
                        game
                    ),
                    prices: aliModel.prices
                },
                game
            )
            state.alicornButton.render()
        },
        renderShatter: function (state) {
            // alicorn needs religion tab so render it
            var shatterWidget = new classes.ui.ChronoforgeWgt(game)
            shatterWidget.render()
            state.shatterButton = shatterWidget.children.find(
                button => button.opts.name === 'Combust TC'
            )
        }
    },
    actions: {
        init ({commit}) {
            console.log("Initializing controllers")
            commit('renderShatter')
            function ifAlicorn () {
                if (game.religionTab.zgUpgradeButtons.length > 0) {
                    commit('renderAlicorns')
                } else {
                    setTimeout(ifAlicorn, 1000)
                }
            }
            ifAlicorn()
        }
    }
}

var store = new Vuex.Store({
    state: {
        // Synchronize with gamePage to allow access to data
        tabList: [
            'calculations',
            'scripts',
            'utilities'
        ],
        gameState: null
    },
    mutations: {
        connectGame (state) {
            state.gameState = game
        }
    },
    getters: {
        getBuilding: state => {
            return building => state.gameState.bld.get(building)
        },
        getEffect: state => {
            return effect => state.gameState.getEffect(effect)
        },
        getPerk: state => {
            return perk => state.gameState.prestige.getPerk(perk)
        },
        getChallenge: state => {
            return challenge => state.gameState.challenges.getChallenge(
                challenge
            )
        },
        getCFU: state => {
            return upgrade => state.gameState.time.getCFU(upgrade)
        },
        getRace: state => {
            return race => state.gameState.diplomacy.races.find(
                r => r.name === race
            )
        },
        getResPool: state => {
            return res => state.gameState.resPool.get(res)
        },
        getResPerTick: state => {
            return res => state.gameState.getResourcePerTick(res)
        }
    },
    modules: {
        calculations,
        scripts,
        utilities,
        controllers,
        preferences
    },
    actions: {
        init ({commit}) {
            commit('connectGame')
        }
    }
})


Vue.filter('capitalize', function (value) {
    if (!value) return ''
    value = value.toString()
    return value.charAt(0).toUpperCase() + value.slice(1)
})
Vue.filter('toPercent', function (value) {
    if (!value) return ''
    return value.toLocaleString("en",
                                {
                                    style:"percent",
                                    maximumFractionDigits: 2
                                });
})
Vue.filter('toShortNum', function (value) {
    if (!value) return ''
    return value.toLocaleString("en",
                                {
                                    maximumFractionDigits: 3
                                });
})

Vue.component('obs-calc', {
    template: '#obs-calc',
    computed: {
        charts: function () {
            return this.$store.getters.chartsPerSecond
        }
    }
})

Vue.component('smr-calc', {
    template: '#smr-calc',
    computed: {
        smrData: function () {
            return this.$store.getters.getNextSMR
        }
    }
})

Vue.component('smr-row', {
    template: '#smr-row',
    props: ['data'],
    computed: {
        isBest: function () {
            return this.data.isBold
        }
    }
})

Vue.component('shatter-calc', {
    template: '#shatter-calc',
    computed: {
        shatterData: function () {
            return [
                {
                    name: 'perShatter',
                    value: this.$store.getters.getShatterProfit({
                        withProd: false,
                        next: false
                    })
                },
                {
                    name: 'perShatterProd',
                    value: this.$store.getters.getShatterProfit({
                        withProd: true,
                        next: false
                    })
                },
                {
                    name: 'perShatterNext',
                    value: this.$store.getters.getShatterProfit({
                        withProd: true,
                        next: true
                    })
                }
            ]
        }
    }
})

Vue.component('sb-tabs', {
    template: '#im-sidebarTabs',
    props: ['scheme'],
    methods: {
        toggleTab (tab) {
            this.$store.commit('toggleTab',tab)
        }
    },
    computed: {
        currentTab () {
            if (!this.$store.getters.getSBOpen) return ''
            return this.$store.getters.getTab
        }
    }
})
Vue.component('sb-container', {
    template: '#im-sidebar',
    methods: {
        toggleTab (tab) {
            this.$store.commit('toggleTab',tab)
        },
        closeSidebar () {
            this.$store.commit('closeSidebar')
        }
    },
    computed: {
        getScheme () {
            if (!this.$store.state.gameState.colorScheme ||
                this.$store.state.gameState.colorScheme == '')
            {
                var append = "classic"
            } else {
                var append =
                    this.$store.state.gameState.colorScheme
            }
            var scheme = "scheme_"+append
            return scheme
        }
    }
})

Vue.component('calculations', {
    template: '#calculations'
})
Vue.component('scripts', {
    template: '<div><h1>Scripts</h1>{{this.$store.getters.getTab}}</div>'
})
Vue.component('utilities', {
    template: '<h1>Utilities</h1>'
})

// ** Template Block

var imTemplates = `
<template id="im-sidebar">
  <div id="root" v-bind:class="[{ open: this.$store.getters.getSBOpen }]">
    <sb-tabs :scheme="getScheme"></sb-tabs>
    <transition name="slide" mode="out-in">
      <div v-if="this.$store.getters.getSBOpen" v-bind:class="['side-data',getScheme]">
        <div @click="closeSidebar" class="close-button">
          <span>&#10006</span>
        </div>
        <component :is="this.$store.getters.getTab"></component>
      </div>
    </transition>
  </div>
</template>
<template id="im-sidebarTabs">
  <div class="side-title">
    <ul class="tabs group">
      <li v-for="name in this.$store.state.tabList" \
          :key="name"
          :class="[name == currentTab ? 'active' : '','tabName',scheme]"
          @click="toggleTab(name)"
          >
        <span>{{ name | capitalize }}</span>
      </li>
    </ul>
  </div>
</template>
<template id="calculations">
  <div>
    <smr-calc></smr-calc>
    <obs-calc></obs-calc>
    <shatter-calc></shatter-calc>
  </div>
</template>
<template id="smr-calc">
  <div>
    <h1>Steam, Magneto, Reactor</h1>
    <table>
      <tr>
        <th>Building</th>
        <th>Increase</th>
      </tr>
      <tr is="smr-row" v-if="data.enabled"
          v-for="data in smrData" v-bind:key="data.building"
          :data="data"></tr>
    </table>
</template>
<template id="smr-row">
  <tr :class="{smrBest: this.data.isBold}">
    <td class="smrTitle">{{data.building}}</td>
    <td class="smrValue">{{data.increase | toPercent}}</td>
  </tr>
</template>
<template id="obs-calc">
  <div>
    <h1>Observatory Starcharts</h1>
    <p>
      <strong>{{ charts.toLocaleString("en") }}</strong> per second
    </p>
  </div>
</template>
<template id="shatter-calc">
  <div>
    <h1>Shatter Profitability</h1>
    <table>
      <tr>
        <th>Per Shatter</th>
        <th>Per Shatter Interval</th>
        <th>next Furnace</th>
      </tr>
      <tr>
        <td v-for="data in shatterData"
            v-bind:key="data.name"
            :class="{posShatter: data.value > 0}">
          {{ data.value | toShortNum }}
        </td>
      </tr>
    </table>
  </div>
</template>
`;

// ** CSS block

var imCSS = `
#root {
    position: fixed;
    right: 0;
    transition: all 1s ease-in-out;
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-columns: 2em auto;
    grid-column-gap: 0.2em;
    width: 2.2em;
    top: 35px;
}

#root .scheme_classic {
    background: white;
}
#root .scheme_grassy {
    background: #C6EBA1;
}
#root.open {
    width: 40em;
}

.close-button {
    position: fixed;
    right: 0.5em;
    top: 0.5em;
    border: solid 1px;
    height: 1.25em;
    width: 1.25em;
    margin: 0.25em;
    filter: invert(75%)brightness(50%);
}
.close-button > span {
    text-align: center;
    height: 1em;
    line-height: 1em;
    width: 100%;
    height: 100%;
    display: inline-block;
    vertical-align: middle;

}

.close-button:hover {
    filter: brightness(50%) invert(25%);
}

.side-title {
    width: 2em;
    height: 100%;
    writing-mode: sideways-lr;
    transition: all 1s ease;
    text-align: center;
}

.side-data {
    height: 85%;
    filter: brightness(95%);
    padding: 1em;
}

.slide-enter-active, .slide-leave-active {
    transition: all 0.5s ease-in-out;
}

.slide-enter {
    transform: translate(100%)
}

.slide-leave-to {
    transform: translate(100%)
}

.tabs {
    list-style-type: none;
    display: flex;
    flex-direction: row-reverse;
    justify-content: start
}

.tabs li {
    float: left;
    position: relative;
    text-decoration: none;
    border-radius: 15px 0px 0px 15px;
    padding: 1em 0;
    margin: 1em 0;
    filter: invert(100%);
    background: rgba(0,0,0,0.4);
    opacity: 0.9;
}

.tabs .active {
    z-index: 3;
    filter: drop-shadow(0px 0px 2px);
}

.smrBest td:first-child {
    font-weight: bold;
}
.posShatter {
    font-weight: bold;
}
`;

GM_addStyle(imCSS);

checkLoaded()

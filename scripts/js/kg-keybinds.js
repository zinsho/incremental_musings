// update key, shift,alt,ctrl as desired but key must be capital letter for it to ensure it maps
var keybinds = [
    {
        name: 'Bonfire',
        key: 'B',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Village',
        key: 'V',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: "Science",
        key: 'S',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Workshop',
        key: 'W',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Trade',
        key: 'T',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Religion',
        key: 'R',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Space',
        key: 'P',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: 'Time',
        key: 'I',
        shift: true,
        alt: false,
        control: false
    },
    {
        name: "Close Options",
        key: "Escape",
        shift: false,
        alt: false,
        control: false,
        action: () => { $('div.dialog:visible').last().hide() }
    },
    {
        name: "Send Hunters",
        key: "h",
        shift: false,
        alt: false,
        control: false,
        action: () => { $("a:contains('Send hunters')").click() }
    },
    {
        name: "Praise the Sun",
        key: "p",
        shift: false,
        alt: false,
        control: false,
        action: () => { $("a:contains('Praise the sun')").click() }
    },
    {
        name: "Observe",
        key: "o",
        shift: false,
        alt: false,
        control: false,
        action: () => {
            var starChart = $('#observeBtn')
            if (starChart[0]) {
                starChart.click()
            }
        }
    },
]

function callKeybind(event) {
    var keybind = keybinds.find(x =>
        x.key === event.key &&
        x.shift == event.shiftKey &&
        x.alt == event.altKey &&
        x.control == event.ctrlKey)
    if (keybind && keybind.name != game.ui.activeTabId) {
        if (keybind.action) {
            keybind.action()
        } else {
            console.log('Switching to: ' + keybind.name)
            game.ui.activeTabId = keybind.name
            game.ui.render()
        }
    }
}

window.addEventListener('keyup', event => callKeybind(event))

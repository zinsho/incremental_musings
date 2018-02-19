// update key, shift,alt,ctrl as desired but key must be capital letter for it to ensure it maps
var tablist = [
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
        action: () => {$('.dialog:visible').last().hide()}
    }
]

function switchTab(event) {
    var newTab = tablist.find(x => x.key === event.key && x.switch == event.switchKey && x.alt == event.altKey && x.control == event.ctrlKey)
    if (newTab && newTab.name != game.ui.activeTabId) {
        if (newTab.action) {
            newTab.action()
        } else {
            console.log('Switching to: ' + newTab.name)
            game.ui.activeTabId = newTab.name
            game.ui.render()
        }
    }
}

window.addEventListener('keyup',event => switchTab(event))
---
title: Intelligent Shatter Engine - Updated
layout: scriptpost
date: 2018-03-07 10:00:00 -0500
tags: kittensgame scripts js
categories: scripts kittensgame
script_link: /js/kg-intellishatter.js
---

This is an update to the [original post]({{site.baseurl}}{% post_url
2018-02-28-kg-intelligentshatter %}) about automated shattering.

Testing showed that the alicorn sacrifice was inconsistent.  Sometimes
it would trigger, other times it would not.  It was not even as simple
as whether you were on the religion tab or not.

In the end I had to actually create my own button to use for
shattering, creating it similarly to how the game does to allow for
consistent shattering.

```js
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

```

Forcing the rendering each time is probably overkill, however this
will require further testing to ensure it doesn't actually need to be
done.

As an added benefit, this allowed for streamlining the shatter widget
code by removing the manual option mappings to model with a simple
`shatterWidget.render()` call.  This is updated in the linked script
as well.

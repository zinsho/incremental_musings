// Function to toggle offline progress on and back off after
// collecting offline progression
function runOfflineUpdate () {
    game.opts.enableRedshift = true
    game.time.calculateRedshift()
    game.opts.enableRedshift = false
}

// Run function every X hours
var offlineHours = 8;
var hours = 60*60*1000;
var getOfflineProduction = setInterval(runOfflineUpdate, offlineHours*hours);

//Disable with
// clearInterval(getOfflineProduction)

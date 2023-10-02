// GET LIST OF ALL SCRIPTS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart();

f3m.login().then(function() {
    getScripts(function(viewId) {
        utils.printEnd();
    });
});


function getScripts(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/scripts';

    axios.get(url).then(function (response) {

        console.log();
        console.log('    scriptType | uniqueName | urn');
        utils.printLine();
        
        for(script of response.data.scripts) {
            console.log('    > ' + script.scriptType + ' | ' + script.uniqueName + ' | ' + script.urn);
        }

        callback();

    }).catch(function (error) {
        console.log(error.message);
    });
    
}
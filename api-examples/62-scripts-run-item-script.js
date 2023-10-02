// RUN CUSTOM ACTION SCRIPT FOR GIVEN RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId     = '57';        // Equals to workspace Items & BOMs in default tenant
let dmsId    = '10591';
let scriptId = '222';       // On demand script 'Update Item Sourcing'


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['Script ID', scriptId] ]);

f3m.login().then(function() {
    runScript(function() {
        utils.printEnd();
    });
});


function runScript(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/scripts/' + scriptId;

    axios.post(url, {}).then(function (response) {

        console.log('    > Script executed successfully');
        callback();

    }).catch(function (error) {
        console.log(error);
    });
    
}
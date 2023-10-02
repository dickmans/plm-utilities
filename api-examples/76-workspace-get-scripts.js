// GET SCRIPT DETAILS OF GIVEN WORKSPACES
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-06-16: Initial Version
   ----------------------------------------------------------------------------- */

// Options
let wsIDs = [57,84];     // list of workspace ids to extract


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


let index = 0;

utils.printStart([['Workspaces', wsIDs]]);

f3m.login().then(function() {
    getAllScripts(function() {
        printWorkspaces();
    });
});


function getAllScripts() {

    if(index < wsIDs.length) {
        getScripts(wsIDs[index++]);
    } else {
        utils.printEnd();
    }

}

function getScripts(workspaceId) {

    console.log();
    console.log('    Getting scripts of workspace ' + workspaceId);
    
    utils.printLine();

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + workspaceId + '/scripts';

    axios.get(url).then(function (response) {

        console.log('    Found ' + response.data.scripts.length + ' scripts in total:');
        console.log();
        
        for(script of response.data.scripts) {
            console.log('    ' + script.scriptBehaviorType + ' : ' + script.uniqueName + ' (' + script.urn + ')');
        }
        
        getAllScripts();
        
    }).catch(function (error) {
        console.log(error);
    });

}
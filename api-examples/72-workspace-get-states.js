// GET LIST OF WORKSPACE STATES
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-10-21: Initial Version
   ----------------------------------------------------------------------------- */


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


let index = 0;
let workspaces;

utils.printStart();

f3m.login().then(function() {
    getWorkspaces(function() {
        printWorkspaces();
    });
});


function getWorkspaces(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/?offset=0&limit=500';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.totalCount + ' workspaces');
        workspaces = response.data.items;
        callback();
        
    }).catch(function (error) {
        console.log(error);
    });

}

function printWorkspaces() {
    
    if(index < workspaces.length) {
        printWorkspace();
    } else {
        utils.printEnd();
    }
    
}

function printWorkspace() {
    
    let workspace = workspaces[index++];
    
    console.log();
    console.log();
    console.log('    Processing Workspace #' + index + ' ' + workspace.title);
    console.log('   ---------------------------------------------------------------'); 

    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + workspace.link + '/workflows/1/states';
    
    axios.get(url).then(function (response) {
        
        if(response.data === '') {
            console.log('    NO WORKFLOW FOR THIS WORKSPACE');
        } else {
            for(state of response.data.states) {
                
                let lock    = (state.locked)  ? ' LOCK ' : '';
                let managed = (state.managed) ? ' MANAGED ' : '';
                let hidden  = (state.hidden)  ? ' HIDDEN ' : '';

                console.log('    > ' + state.name + ' (' + state.customLabel + ')' + hidden + lock + hidden);   

            }
        }

        printWorkspaces();
        
    }).catch(function (error) {
        console.log(error);
    });
    
}
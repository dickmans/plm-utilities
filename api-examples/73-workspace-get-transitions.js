// GET LIST OF WORKSPACE TRANSITIONS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-10-21: Initial Version
   ----------------------------------------------------------------------------- */

// Options
let wsIDs = [];     // list of workspace ids to extract, leave blank for all workspaces


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


let index = 0;
let workspaces;

utils.printStart([['Workspaces', wsIDs]]);

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
        
        let workspace   = workspaces[index++];
        let temp        = workspace.urn.split('.');
        let wsId        = Number(temp[temp.length - 1]);
        
        if(wsIDs.length === 0) {
            printWorkspace(workspace, wsId);
        } else if (wsIDs.indexOf(wsId) >= 0) {
            printWorkspace(workspace, wsId);
        } else {
            printWorkspaces();
        }
        
    } else {
        utils.printEnd();
    }
    
}

function printWorkspace(workspace, wsId) {
    
    console.log();
    console.log();
    console.log('    Processing Workspace #' + index + ' ' + workspace.title + ' (' + wsId + ')');
    console.log('   ---------------------------------------------------------------'); 

    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + workspace.link + '/workflows/1/transitions';

    axios.get(url).then(function (response) {

        if(response.data === '') {
            console.log('    NO WORKFLOW FOR THIS WORKSPACE');
        } else {

            for(transition of response.data) {

                let fromState        = (transition.hasOwnProperty('fromState') ) ? transition.fromState.title : 'START';
                let conditionScript  = (transition.hasOwnProperty('conditionScript') ) ? transition.conditionScript.title : ' - ';
                let validationScript = (transition.hasOwnProperty('validationScript')) ? transition.validationScript.title : ' - ';
                let actionScript     = (transition.hasOwnProperty('actionScript')    ) ? transition.actionScript.title : ' - ';

                console.log();

                console.log('    Transition ' + transition.name + ' (' + transition.customLabel + ')');
                console.log('    > from ' + fromState + ' to ' + transition.toState.title);
                console.log('    > Permission : ' + transition.permission.title);
                console.log('    > Notify Owner : ' + transition.sendEmail);
                console.log('    > Notify Assignee : ' + transition.notifyPerformers);
                console.log('    > Show in MOW : ' + transition.showInOutstanding);
                console.log('    > Save Step Label : ' + transition.saveStepLabel);
                console.log('    > Condition Script : ' + conditionScript);
                console.log('    > Validation Script : ' + validationScript);
                console.log('    > Acttion Script : ' + actionScript);
                console.log('    > Is Hidden : ' + transition.hidden);

            }
        }

        printWorkspaces();

    }).catch(function (error) {
        console.log(error);
    });
    
}
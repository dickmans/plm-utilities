// GET LIST OF ALL WORKSPACES
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
    getWorkspaces();
});


function getWorkspaces() {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/?offset=0&limit=500';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.totalCount + ' workspaces');
        
        workspaces = response.data.items;
        
        printWorkspaces();
        
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
    console.log('   ---------------------------------------------------------------'); 
    console.log('    Processing Workspace #' + index + ' ' + workspace.title);
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + workspace.link;
    
    axios.get(url).then(function (response) {
        
        console.log('    URN      : ' + response.data.urn); 
        console.log('    Category : ' + response.data.category.name); 
        
        printWorkspaces();
        
    }).catch(function (error) {
        console.log(error);
    });
    
}
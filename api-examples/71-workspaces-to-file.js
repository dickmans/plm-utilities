// SAVE WORKSPACES INFORMATION IN FILE
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   ----------------------------------------------------------------------------- */

// Options
let fileName = '../out/workspaces.txt';


const fs        = require('fs');
const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([['Filename', fileName]]);

f3m.login().then(function() {
    getWorkspaces(function(workspaces) {
        saveData(workspaces, function() {
            utils.printEnd();
        });
    });
});


function getWorkspaces(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/?offset=0&limit=500';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.totalCount + ' workspaces');
        
        callback(response.data.items);
        
    }).catch(function (error) {
        console.log(error);
    });

}

function saveData(workspaces, callback) {
    
    for(workspace of workspaces) {
        let data = workspace.link + ';' + workspace.title + '\n';
        fs.appendFileSync(fileName, data + '\r\n');
    }

    console.log('    Workspace data saved in ' + fileName);
    callback();

}
// GET RELATIONSHIP TAB DETAILS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-14: Moved login to utils.js
    - 2021-09-14: Initial version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '90';     // Equals to workspace Project Tasks in default tenant
let dmsId       = '8845';   // Matches 'P0034 - Review sketches' in default tenant


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getRelationships(function() {
        utils.printEnd();
    });
});


function getRelationships(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/10';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.length + ' related items');
        
        utils.printLine();
        
        for(item of response.data) {
            
            console.log('    ' + item.item.title);
            
        }
        
        callback();
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}
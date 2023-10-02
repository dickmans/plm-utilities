// REMOVE EXISTING CONNECTION IN RELATIONSHIP TAB
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-04-26: Initial version
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
    getRelationships(function(relatedId) {
        removeRelationship(relatedId, function() {
            utils.printEnd();
        });
    });
});

function getRelationships(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/10';
    
    axios.get(url).then(function (response) {
        
        let result = '';

        console.log('    Found ' + response.data.length + ' related items');
        
        utils.printLine();

        if(response.data.length > 0) {

            result = response.data[0].item.link.split('/')[6];
            console.log('    Item ' + response.data[0].item.title + ' (' + result + ') will be removed');

        }
        
       callback(result);
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}


function removeRelationship(relatedId, callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/10/relationships/' + relatedId;
    
    axios.delete(url).then(function (response) {
        callback();
    }).catch(function (error) {
        console.log(error.message);
    });
    
}
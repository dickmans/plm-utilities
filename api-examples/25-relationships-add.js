// ADD NEW CONNECTION IN RELATIONSHIP TAB
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
let relatedId   = '14131'   // dmsId of item to connect


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['Item to connect', relatedId] ]);

f3m.login().then(function() {
    addRelationship(function() {
        utils.printEnd();
    });
});


function addRelationship(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/10';
    
    axios.post(url, {
        'description' : 'Relationship created by API',
        'direction' : {
            'type' : 'Bi-Directional'
        }
    },{
        headers : {
            'content-location' : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/10/linkable-items/' + relatedId
        }
    }).then(function (response) {
        callback();
    }).catch(function (error) {
        console.log(error.message);
    });
    
}
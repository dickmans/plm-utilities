// GET FIELD DETAILS OF GIVEN WORKSPACES
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
    getAllFields(function() {
        printWorkspaces();
    });
});


function getAllFields() {

    if(index < wsIDs.length) {
        getFields(wsIDs[index++]);
    } else {
        utils.printEnd();
    }

}

function getFields(workspaceId) {

    console.log();
    console.log('    Getting fields of workspace ' + workspaceId);

    utils.printLine();

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + workspaceId + '/fields';

    axios.get(url).then(function (response) {

        console.log('    Found ' + response.data.fields.length + ' fields in total:');
        console.log();
        
        for(field of response.data.fields) {
            let urn = field.urn.split('.');
            let fieldID = urn[urn.length - 1];
            console.log('    ' + field.name + ' | ' + fieldID + ' | ' + field.description);
        }
        
        getAllFields();
        
    }).catch(function (error) {
        console.log(error);
    });

}
// DELETE / ARCHIVE RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2021-11-14: Added Examples for various field types
    - 2020-09-24: Using axios library for requests
    - 2020-96-24: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';
let dmsId       = '14974';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    deleteItem(function() {
        utils.printEnd();
    });
});


function deleteItem(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '?deleted=true';

    axios.patch(url, {}, {
        headers : {
            'Content-Type' : 'application/json'
        }
    }).then(function (response) {
        console.log('    Delete completed successfully');
        callback();
    }).catch(function (error) {
        console.log(error);
    });

}
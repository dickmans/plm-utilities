// ADD ITEM TO BOM
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';           // Equals to workspace Items & BOMs in default tenant
let dmsIdParent = '14974';
let dmsIdChild  = '14975';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID Parent', dmsIdParent], ['DMSID Child', dmsIdChild] ]);

f3m.login().then(function() {
    addBOMRow(function() {
        utils.printEnd();
    });
});

function addBOMRow(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsIdParent + '/bom-items';

    axios.post(url, {
        "quantity"    : 10,
        "item"        : { 
            link     : "/api/v3/workspaces/" + wsId + "/items/" + dmsIdChild
        }
    }).then(function (response) {
        console.log('    Status code : ' + response.status); 
        callback();
    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}
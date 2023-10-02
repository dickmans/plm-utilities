// GET WHERE USED INFORMATION OF GIVEN ITEM
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-09-14: Initial version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId    = '57';          // Equals to workspace Items & BOMs in default tenant
let dmsId   = '14975';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getWhereUsed(function() {
        utils.printEnd();
    });
});


function getWhereUsed(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/where-used?depth=2';
    
    axios.get(url).then(function (response) {
        
        console.log();
        
        for(node of response.data.nodes) {
            console.log(node.item);
        }

        callback();
        
    }).catch(function (error) {
        console.log(error);    
    });
    
}
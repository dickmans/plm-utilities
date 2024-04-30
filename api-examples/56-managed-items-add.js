// ADD MANAGED ITEM TO A CHANGE PROCESS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-04-30: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsIdCO      = '84';           // Equals to workspace Change Orders in default tenant
let dmsIdCO     = '11013';
let wsIdItem    = '57';           // Item to add to Change Order
let dmsIdItem   = '13891';        // Item to add to Change Order


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsIdCO], ['DMSID Change Order', dmsIdCO] ]);

f3m.login().then(function() {
    addManagedItem(function() {
        utils.printEnd();
    });
});

function addManagedItem(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsIdCO + '/items/' + dmsIdCO + '/affected-items';


    

    axios.post(url, [
        '/api/v3/workspaces/' + wsIdItem + '/items/' + dmsIdItem
    ], {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.affected.items.bulk+json'
        }
    }).then(function (response) {
        console.log(response.data);
        callback();
    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}
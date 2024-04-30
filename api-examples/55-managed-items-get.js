// GET MANAGED ITEMS OF A CHANGE PROCESS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-04-30: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsIdCO  = '84';           // Equals to workspace Change Orders in default tenant
let dmsIdCO = '11013';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsIdCO], ['DMSID Change Order', dmsIdCO] ]);

f3m.login().then(function() {
    getManagedItems(function() {
        utils.printEnd();
    });
});

function getManagedItems(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsIdCO + '/items/' + dmsIdCO + '/views/11';

    axios.get(url).then(function (response) {
        console.log(response.data.affectedItems);
        callback();
    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}
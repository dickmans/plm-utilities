// UPDATE TRANSITION OF FIRST MANAGED ITEM OF A CHANGE PROCESS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2024-05-08: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsIdCO      = '84';           // Equals to workspace Change Orders in default tenant
let dmsIdCO     = '17318';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsIdCO], ['DMSID Change Order', dmsIdCO] ]);

f3m.login().then(function() {
    utils.printLine();
    getAffectedItems(function(affectedItems) {
        updateManagedItem(affectedItems, function() {
            utils.printEnd();
        });
    });
});

function getAffectedItems(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsIdCO + '/items/' + dmsIdCO + '/views/11';

    axios.get(url).then(function (response) {
       callback(response.data.affectedItems);
    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}

function updateManagedItem(affectedItems, callback) {

    let affectedItem = affectedItems[0]
    let url          = 'https://' + settings.tenant + '.autodeskplm360.net' + affectedItem.__self__;

    console.log('    First Affected Item : ' + affectedItem.item.title);
    console.log('    Setting transition  : ' + affectedItem.transitions[0].name);

    axios.put(url, {
        targetTransition : {
            link : affectedItem.transitions[0].__self__
        }
    }).then(function (response) {
        console.log('    Response code       : ' + response.status);
        callback();
    }).catch(function (error) {
        console.log('    ERROR : ' + error.message);
        callback();
    });
    
}
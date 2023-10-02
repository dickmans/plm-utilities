// GET MANAGED ITEMS TAB DETAILS
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2021-03-17: Initial version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '84';     // Equals to Change Orders in default tenant
let dmsId       = '14245';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getManagedItems(function() {
        utils.printEnd();
    });
});


function getManagedItems(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/11';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.affectedItems.length + ' affected items');
        console.log();
        console.log();
        console.log('    Available Properties');
        
        utils.printLine();

        for (var key in response.data.affectedItems[0]) {
            console.log('    ' + key);
        }
        
        console.log();
        console.log();
        console.log('    List of affected items');
        
        utils.printLine();
        
        for(affectedItem of response.data.affectedItems) {
            
            console.log('    ' + affectedItem.item.title);
            
        }
        
        callback();
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}
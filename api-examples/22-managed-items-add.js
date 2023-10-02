// UPDATE DETAILS OF A MANAGED ITEMS ENTRY
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-12-10: Initial version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '84';
let dmsId       = '14245';
let wsIdToAdd   = '57';
let dmsIdToAdd  = '15631';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getManagedItems(function() {
        addManagedItem(function() {
            console.log();
            console.log('    Item has been added, retrieving data again');
            console.log();
            getManagedItems(function() {
                utils.printEnd();
            });
        });
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
        
        callback(response.data);
        
    }).catch(function (error) {
        console.log(error.message);
    });
    
}

function addManagedItem(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/affected-items';
    let params = ['/api/v3/workspaces/' + wsIdToAdd + '/items/' + dmsIdToAdd]

    axios.post(url, params, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.affected.items.bulk+json'
        }
    }).then(function (response) {
        callback();
    }).catch(function (error) {
        console.log(error.message);
    });
    
}
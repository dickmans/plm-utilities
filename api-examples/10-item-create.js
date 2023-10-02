// CREATE NEW RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-11-13: Switch to axios library
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';    // Workspace ID (57 matches the Items & BOMs workspace in default tenant)
let sectionId   = '203';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');

utils.printStart([ ['Workspace', wsId], ['Section', sectionId] ]);

f3m.login().then(function() {
    createItem(function() {
        utils.printEnd();
    });
});


function createItem(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items';
    let pre = '/api/v3/workspaces/' + wsId;
    
    let sections = [{
        'link': pre + '/sections/' + sectionId,
        'fields': [
            { '__self__': pre + '/views/1/fields/TITLE',  'value': 'New Part' }
        ]
    }];
    
    axios.post(url, {
        'sections' : sections
    }).then(function (response) {
        
        console.log();
        console.log('    ITEM CREATION');
        utils.printLine();
        console.log('    Creation successful');
        console.log('    ' + response.headers.location);
        console.log();
        
        callback();

   }).catch(function (error) {

        console.log('Error during creation');
        console.log(error);
    
    });

}
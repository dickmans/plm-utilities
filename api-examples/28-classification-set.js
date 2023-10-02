// CREATE NEW RECORD & SET CLASSIFICATION
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-30: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId                        = '57';     // Equals to Items & BOMs in default tenant
let sectionIdTitle              = '203';
let sectionIdClassification     = '709';
let classificationId            = '2';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ 
    ['Workspace', wsId], 
    ['Section 1', sectionIdTitle], 
    ['Section 2', sectionIdClassification], 
    ['Class ID', classificationId]
 ]);

 f3m.login().then(function() {
    createItem(function() {
        utils.printEnd();
    });
});


function createItem(callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items';
    let pre = '/api/v3/workspaces/' + wsId;
    
    let sections = [{
        'link': pre + '/sections/' + sectionIdTitle,
        'fields': [
            { '__self__': pre + '/views/1/fields/TITLE',  'value': 'New Part' }
        ]
    },{
        'link': pre + '/sections/' + sectionIdClassification,
        'classificationId' : classificationId,
        'fields': []
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
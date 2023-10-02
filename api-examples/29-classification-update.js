// UPDATE CLASSIFICATION DETAILS OF EXISTING ITEM
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-30: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';
let dmsId       = '15070';
let sectionId   = '709';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['Section', sectionId] ]);

f3m.login().then(function() {
    updateItemDetails(function() {
        utils.printEnd();
    });
});


function updateItemDetails(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    let sections = [{
        'link'    : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/sections/' + sectionId,
        'fields' : []
    }]
    
    updateSingleLineText(sections[0], '0CWS_HEIGHT_MM_', '1000');
    
    axios.patch(url, {
        'sections' : sections
    }).then(function (response) {
        if(response.status === 204) {
            console.log('    Update successful');
        } else {
           console.log('    Status code : ' + response.status); 
        }
        callback();
    }).catch(function (error) {
        console.log(error.message);
    });
    
}

function updateSingleLineText(elemSection, fieldId, value) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : value
    });
    
}
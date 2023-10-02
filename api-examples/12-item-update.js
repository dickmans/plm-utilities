// UPDATE ITEM DETAILS OF EXISTING ITEM
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2021-11-14: Added Examples for various field types
    - 2020-09-24: Using axios library for requests
    - 2020-96-24: Remove dependency on request-promise
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';
let dmsId       = '10449';
let sectionId   = '203';


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
    
    updateSingleLineText(sections[0], 'TITLE', 'Newest Title');
    // updateParagraph(sections[0], 'DESCRIPTION', 'Descriptive Text');
    // updateDate(sections[0], 'TARGET_DATE', '2021-04-20');
    // updatePickList(sections[0], 'PRIORITY', '2', 'CUSTOM_LOOKUP_PRIORITTEN');
    // updateWSPickList(sections[0], 'IMPACTED_PRODUCTS', '47', '7407');
    
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
function updateParagraph(elemSection, fieldId, value) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : value
    });
    
}
function updateDate(elemSection, fieldId, value) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : value
    });
    
}
function updatePickList(elemSection, fieldId, option, pickListId) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : {
            link : '/api/v3/lookups/' + pickListId + '/options/' + option
        }
    });
    
}
function updateWSPickList(elemSection, fieldId, linkedWSID, linkedDMSID) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : {
            link : '/api/v3/workspaces/' + linkedWSID + '/items/' + linkedDMSID
        }
    });
    
}
function updateMultiWSPickList(elemSection, fieldId, option, pickListId) {
    
    elemSection.fields.push({
        '__self__'  : '/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/views/1/fields/' + fieldId,
        'urn'       : 'urn:adsk.plm:tenant.workspace.item.view.field:' + settings.tenant + '.' + wsId + '.' + dmsId + '.1.' + fieldId,
        'value'     : [{
            link : '/api/v3/workspaces/' + linkedWSID + '/items/' + linkedDMSID
        }]
    });
    
}
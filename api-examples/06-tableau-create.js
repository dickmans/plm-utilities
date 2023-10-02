// GET LIST OF TABLEAUS OF GIVEN USER
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-08-07: Initial Version
    -------------------------------------------------------------------------------------------------------- */


// Options
var wsId        = '84';  // Workspace ID (84 matches the Change Orders workspace in default tenant)


const axios     = require('axios');
const settings  = require('../settings.js');


console.log('   ');
console.log('   **************************** START ****************************');
console.log('   ');
console.log('    SETTINGS');
console.log('   ---------------------------------------------------------------');
console.log('    Tenant        : ' + settings.tenant); 
console.log('    User Name     : ' + settings.user); 
console.log('    Workspace     : ' + wsId); 
console.log('   '); 


login(function() {
    createTableau();
});


// Login to Autodesk Platform Services
function login(callback) {
    
    let data = {
        'grant_type' : 'client_credentials',
        'scope' : 'data:read'
    }

    axios.post('https://developer.api.autodesk.com/authentication/v2/token', data, {
        headers: {
            'accept'        : 'application/json',
            'authorization' : 'Basic ' + btoa(settings.clientId + ':' + settings.clientSecret),
            'content-type'  : 'application/x-www-form-urlencoded'
        }
    }).then(function (response) {
        
        if (response.status == 200) {               
                
            axios.defaults.headers.common['Content-Type']   = 'application/json';
            axios.defaults.headers.common['Accept']         = 'application/json';
            axios.defaults.headers.common['X-user-id']      = settings.user;
            axios.defaults.headers.common['X-Tenant']       = settings.tenant.toUpperCase();
            axios.defaults.headers.common['Authorization']  = 'Bearer ' + response.data.access_token;
            
            console.log('    Login to Autodesk Platform Services successful');

            callback();

        } else {

            console.log();      
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');      
            console.log('             LOGIN FAILED');
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); 
            console.log(); 
            
            console.log(error);

        }

    }).catch(function (error) {

        console.log(error);

    });
    
}


function createTableau() {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/tableaus';

    let params = {
        'name'          : 'New View',
        'createdDate'   : new Date(),
        'isDefault'     : false,
        'columns'       : [{
            'displayOrder' : 0,
            'field': {
                'title'     : 'Item Descriptor',
                '__self__'  : '/api/v3/workspaces/84/views/0/fields/DESCRIPTOR',
                'urn'       : '',
                'type'      : { 'link' : '/api/v3/field-types/4' }
            },
            'group' : { 'label' : 'ITEM_DESCRIPTOR_FIELD' }
        },{
            'displayOrder' : 1,
            'field': {
                'title'     : 'Created on',
                '__self__'  : '/api/v3/workspaces/84/views/0/fields/CREATED_ON',
                'urn'       : '',
                'type'      : { 'link' : '/api/v3/field-types/3' }
            },
            'group' : { 'label' : 'LOG_FIELD' }
        },{
            'displayOrder' : 2,
            'field': {
                'title'     : 'Created on',
                '__self__'  : '/api/v3/workspaces/84/views/0/fields/LAST_MODIFIED_ON',
                'urn'       : '',
                'type'      : { 'link' : '/api/v3/field-types/3' }
            },
            'group' : { 'label' : 'LOG_FIELD' }
        },{
            'displayOrder' : 3,
            'field': {
                'title'     : 'Current State',
                '__self__'  : '/api/v3/workspaces/84/views/0/fields/WF_CURRENT_STATE',
                'urn'       : '',
                'type'      : { 'link' : '/api/v3/field-types/3' }
            },
            'group' : { 'label' : 'WORKFLOW_FIELD' }
        }]
    }

    axios.post(url, params, {
        'headers' : {
            'Content-Type' : 'application/vnd.autodesk.plm.meta+json'
        }
    }).then(function () {
        
        console.log();
        console.log('    SUCCESS');
        console.log();
        
    }).catch(function (error) {
        console.log(error);
    });
    
}
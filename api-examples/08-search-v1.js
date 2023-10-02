// PERFORM SEARCH UDING V1 API but V3 authentication
// Pull information from a given workspace using former V1 API
// See filter options at https://help.autodesk.com/view/PLM/ENU/?guid=PLM_360_REST_APIv1_Resource_Endpoints_Item_Search_items_search_filter_types_GET_List_field_data_type_filters_html
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-07-05: Upgrade to V2 API for authentication
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2020-11-02: Initial Version
   -------------------------------------------------------------------------------------------------------- */


// Options
var wsId = '84';  // Workspace ID (84 matches the Change Orders workspace in default tenant)


/* --------------------------------------------------------------------------------------------------------
     Do not modify below
   -------------------------------------------------------------------------------------------------------- */

const axios     = require('axios');
const settings  = require('../settings.js');


console.log('   ');
console.log('   **************************** START ****************************');
console.log('   ');
console.log('    SETTINGS');
console.log('   ---------------------------------------------------------------');
console.log('    Tenant     : ' + settings.tenant); 
console.log('    User Name  : ' + settings.user); 
console.log('    Workspace  : ' + wsId); 
console.log('   '); 


login(function() {
    searchV1();
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
            axios.defaults.headers.common['X-Tenant']       = settings.tenant;
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


// Perform Search
function searchV1() {
        
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/rest/v1/workspaces/' + wsId + '/items/search';
    
    axios.post(url, {
        'pageNo'      : 1,
        'pageSize'    : 100,
        'logicClause' : 'AND',
        'fields'      : [ 
            { fieldID: 'NUMBER', fieldTypeID: 0 },
            { fieldID: 'TITLE', fieldTypeID: 0 },
            { fieldID: 'DESCRIPTION', fieldTypeID: 0 },
            { fieldID: 'WF_CURRENT_STATE', fieldTypeID: 1 },
            { fieldID: 'DESCRIPTOR', fieldTypeID: 15 } 
        ],
        'filter' : [{ 
            fieldID: 'WF_CURRENT_STATE',
            fieldTypeID: '1',
            filterType: { filterID: '15' },
            filterValue: 'Preparation' 
        }],
        'sort' : [{
            'fieldID'        : 'TITLE',
            'fieldTypeID'    : 0,
            'sortDescending' : false
        }]
    }).then(function (response) {
        console.log(response.data);
    }).catch(function (error) {
        console.log(error);    
    });
    
}
// GET COLUMNS AND DATA OF FIRST TABLEAU OF GIVEN USER
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-07-05: Upgrade to V2 API for authentication
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
    - 2020-10-13: Initial Version
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


let index = 0;
let tableaus;


login(function() {
    getTableaus(function() {
        printTableaus();
    });
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

function getTableaus(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/tableaus';
    
    axios.get(url).then(function (response) {
        
        console.log('    Found ' + response.data.tableaus.length + ' tableaus'); 
        
        tableaus = response.data.tableaus;
        
        callback();
        
    }).catch(function (error) {
        console.log(error);
    });
    
}


function printTableaus() {
    
    if(index < tableaus.length) {
        printTableau();
    } else {
        console.log('   ');
        console.log('   ***************************** END *****************************');
        console.log('   ');
    }
    
}

function printTableau() {
    
    let tableau = tableaus[index++];
    
    console.log();
    console.log();
    console.log('  ---------------------------------------------------------------'); 
    console.log('   Processing Tableau #' + index + ' ' + tableau.title);
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net' + tableau.link;
    
    axios.get(url).then(function (response) {
        
        console.log('   Found ' + response.data.items.length + ' records'); 
        
        let columns = '';
        
        if(response.data.items.length > 0) {

            for(column of response.data.items[0].fields) {
            
                let temp = column.urn.split('.');
                let fieldID = temp[temp.length - 1];
            
                columns += fieldID + ' | ';
                
            }      
            
            console.log('   Columns: ' + columns);
            console.log('  ---------------------------------------------------------------'); 
            
            for(item of response.data.items) {
                
                let record = '   ';

                for(field of item.fields) {
                    record += field.value + ' | ';
                }

                console.log(record);
                
            }
        }
        
        printTableaus();
        
    }).catch(function (error) {
        console.log(error);
    });
    
}
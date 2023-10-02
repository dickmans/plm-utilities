// PERFORM SEARCH AND SAVE OUTPUT IN FILE
// Pulls information of a given workspace in bulk and stores results in a file
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-07-05: Upgrade to V2 API for authentication
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Replaced library 'querystring'
   -------------------------------------------------------------------------------------------------------- */

// Options
var wsId        = '84';             // Workspace ID (84 matches the Change Orders workspace in default tenant)
let limit       = 50;               // Search result limit
let query       = '00';             // Search string
let fileName    = '../out/results.json';   // output file name


const fs        = require('fs');
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
console.log('    Search String : ' + query); 
console.log('    File Name     : ' + fileName); 
console.log('   '); 


login(function() {
    search(0, 'all', function(data) {
        save(data);
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


// Perform Search
function search(offset, revs, callback) {

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/search-results?limit=' + limit + '&offset=' + offset + '&query=' + query + '+AND+(workspaceId%3D' + wsId + ')';
    
    if(revs == 'all') url += '&revision=2';
    
    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.items.bulk+json'
        }
    }).then(function (response) {
        callback(response.data.items);
    }).catch(function (error) {
        console.log(error);    
    });
    
}


// Save data to file
function save(items) {
    
    fs.appendFileSync(fileName, JSON.stringify(items, null, 3));
    
    console.log('    DONE ');    
    console.log();    
}
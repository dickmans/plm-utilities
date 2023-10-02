// LOGIN TO FUSION LIFECYCLE USING A FORGE APP
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-07-05: Upgrade to V2 API for authentication
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Switch to axios instead of request-promise
    - 2021-09-13: Replaced library 'querystring'
   -------------------------------------------------------------------------------------------------------- */


const axios     = require('axios');
const settings  = require('../settings.js');


login();


function login() {
    
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
                
            console.log();
            console.log('    Login to Autodesk Platform Services successful');
            console.log();

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

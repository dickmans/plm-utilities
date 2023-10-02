// UPLOAD IMAGE TO EXISTING RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-10-08: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';       // Workspace ID (57 matches the Items & BOMs workspace in default tenant)
let dmsId       = '14974';
let fieldID     = 'IMAGE';
let path        = '../in/image.jpg';


const axios     = require('axios');
const fs        = require('fs');
const FormData  = require('../node_modules/form-data');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['FieldID', fieldID], ['Path', path] ]);

f3m.login().then(function() {
    initForm(function(formData) {
        getItemDetails(formData, function(formData) {
            uploadImage(formData, function() {
                utils.printEnd();
            });
        });
    });
});


function initForm(callback) {
    
    let formData = new FormData();
    
    formData.append(fieldID, fs.createReadStream(path), {
        contentType: 'application/octet-stream'
    });   
    
    callback(formData);
    
}

function getItemDetails(formData, callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    axios.get(url).then(function (response) {
        
        formData.append('itemDetail', JSON.stringify(response.data), {
            filename: 'blob',
            contentType: 'application/json'
        });
                
        callback(formData);
                
    }).catch(function (error) {
        console.log(error);    
    });
    
}

function uploadImage(formData, callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId;
    
    axios.put(url, formData, {
        headers : formData.getHeaders()
    }).then(function (response) {
        if(response.status === 204) {
            console.log('    Image upload successful');
        } else {
           console.log('    Status code : ' + response.status); 
        }
        callback();
    }).catch(function (error) {
        console.log(error);
    });
    
}
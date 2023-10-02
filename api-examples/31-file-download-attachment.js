// DOWNLOAD ALL ATTACHMENTS OF A GIVEN RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2020-11-04: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId    = '57';     // Equals to Items & BOMs in default tenant
let dmsId   = '14974';
let path    = '../out';


const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
const fs        = require('fs');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId], ['path', path] ]);

f3m.login().then(function() {
    getAttachments(function(data) {
        for(attachment of data.attachments) {
            downloadAttachment(attachment.url, path + '/' + attachment.name);
        }
    });
});


const downloadAttachment = async (url, pathFile) => {
    
    delete axios.defaults.headers.common['Authorization'];

    try {
        const response = await axios({
            method        : 'GET',
            url           : url,
            responseType  : 'stream',
        });

        await response.data.pipe(fs.createWriteStream(pathFile));
        
        console.log('    Successfully downloaded ' + pathFile);
        utils.printEnd();
        
    } catch (err) {
        throw new Error(err);
    }
    
};

function getAttachments(callback) {
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments?asc=name';
    
    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.attachments.bulk+json'
        }
    }).then(function (response) {
        callback(response.data);
    }).catch(function (error) {
        console.log(error);    
    }); 
    
}
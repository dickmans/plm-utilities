// UPLOAD FILE TO EXISTING RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-09-13: Moved login to utils.js
    - 2021-04-16: Fixed issue with viewing
    - 2021-04-12: Fixed issue when attachments are empty
    - 2020-11-06: Switch to axios library
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';     // Workspace ID (57 matches the Items & BOMs workspace in default tenant)
let dmsId       = '14974';
let filePath    = '../in';
let fileName    = 'BOM.xlsx';
let folderName  = '';


const axios     = require('../node_modules/axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');
const fs        = require('fs');


utils.printStart([ 
    ['Workspace', wsId], 
    ['DMSID', dmsId], 
    ['File Path', filePath], 
    ['Filename', fileName], 
    ['Folder', folderName] 
]);

f3m.login().then(function() {
    getAttachments(function(attachments) {
        parseAttachments(attachments);
    });
});


// Step #1: Get all item attachments
function getAttachments(callback) {
    
    console.log('    > Getting list of existing attachments');

    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments?asc=name';
    
    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.attachments.bulk+json'
        }
    }).then(function (response) {
        callback(response);
    }).catch(function (error) {
        console.log(' > getAttachments ERROR');
        console.log(error.message);
    });  
    
}


// Step #2: Validate if defined file or folder exists
function parseAttachments(attachments) {
    
    console.log('    > Checking list of attachments');
    
    let folderId    = '';
    let fileId      = '';
    
    if(attachments.status === 200) {
        for(attachment of attachments.data.attachments) {
            if(attachment.name === fileName) {
                fileId = attachment.id;
            } 
            if(attachment.folder !== null) {
                if(attachment.folder.name === folderName) {
                    folderId = { id : attachment.folder.id };
                }
            }
        }
    }
    
    if(fileId !== '') {
        createVersion(folderId, fileId);
    } else if(folderName === '') {
        createFile(null);
    } else if(folderId === '') {
        createFolder(function(data) {
            createFile({'id':data});
        });
    } else {
        createFile(folderId);
    }
    
}


// Step #3: Create folder if it does not exist
function createFolder(callback) {
    
    console.log('    > Creating folder ' + folderName);
        
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/folders';
    
    axios.post(url, {
        'folderName' : folderName 
    }).then(function (response) {
        
        let location    = response.headers.location;
        let temp        = location.split('/');
        let folderId    = temp[temp.length - 1];
        
        callback(folderId);

    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}


// Step #4: Create new record in attachments tab if file does not exist yet
function createFile(folderId) {
    
    console.log('    > Creating file record');
    
    let stats = fs.statSync(filePath + '/' + fileName);
    let url   = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments';
       
    axios.post(url, {
        'description'   : fileName,
        'name'          : fileName,
        'resourceName'  : fileName,
        'folder'        : folderId,
        'size'          : stats.size
    }).then(function (response) {
        prepareUpload(response.data, function() {
            uploadFile(response.data, function(fileId) {
                setStatus(fileId);
            });          
        });
    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}
function prepareUpload(fileData, callback) {
    
    console.log('    > Preparing file upload to S3');

    axios({
        method  : 'options',
        url     :  fileData.url, 
        headers : {
            'Accept'            : '*/*',
            'Accept-Encoding'   : 'gzip, deflate, br',
            'Accept-Language'   : 'en-US,en;q=0.9,de;q=0.8,en-GB;q=0.7',
            'Access-Control-Request-Headers': 'content-type,x-amz-meta-filename',
            'Access-Control-Request-Method' : 'PUT',
            'Host'              : 'plm360-aws-useast.s3.amazonaws.com',
            'Origin'            : 'https://' + settings.tenant + '.autodeskplm360.net',
            'Sec-Fetch-Mode'    : 'cors',
            'Sec-Fetch-Site'    : 'cross-site'
        }
    }).then(function () {
        callback();
    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}
function uploadFile(fileData, callback) {
    
    console.log('    > Uploading file now');
    
    let authorization = axios.defaults.headers.common['Authorization'];
    let headers = fileData.extraHeaders;
        
    headers['Accept']           = '*/*';
    headers['Accept-Encoding']  =  'gzip, deflate, br';
    headers['Accept-Language']  =  'en-US,en;q=0.9,de;q=0.8,en-GB;q=0.7';
    headers['Host']             =  'plm360-aws-useast.s3.amazonaws.com';
    headers['Origin']           =  'https://' + settings.tenant + '.autodeskplm360.net';
    headers['Sec-Fetch-Mode']   =  'cors';
    headers['Sec-Fetch-Site']   =  'cross-site';

    delete axios.defaults.headers.common['Authorization'];
        
    axios.put(fileData.url, fs.readFileSync(filePath + '/' + fileName),{
        headers : headers
    }).then(function () {
        axios.defaults.headers.common['Authorization'] = authorization;
        callback(fileData.id);
    }).catch(function (error) {
        console.log(error);
        console.log(error.message);
    }); 
    
}
function setStatus(fileId) {
    
    console.log('    > Setting Status in PLM');
    
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments/' + fileId;
    
    axios.patch(url, {
        status : {
            'name' : 'CheckIn'
        }
    }).then(function (response) {
        utils.printEnd();
    }).catch(function (error) {
        console.log(error.message);
    }); 
    
}


// If file exists already, upload new version
function createVersion(folderId, fileId) {
    
    console.log('    > Creating new version as file exists already');
    
    let stats   = fs.statSync(fileName);
    let url     = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments/' + fileId;
    
    if(folderId === '') folderId = null;
    
    axios.post(url, {
        'description'   : fileName,
        'fileName'      : fileName,
        'name'          : fileName,
        'resourceName'  : fileName,
        'folder'        : folderId,
        'fileTypeString': 'file/type',
        'size'          : stats['size']
    }).then(function (response) {
        prepareUpload(response.data, function() {
            uploadFile(folderId, response.data, function(fileId) {
                setStatus(folderId, fileId);
            });
        });
    }).catch(function (error) {
        console.log(error.message);
    });    
    
}
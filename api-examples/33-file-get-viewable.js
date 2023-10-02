// GET VIEWABLES WITHIN ATTACHMENTS OF DEFINED RECORD
// Before using this script, create a new Forge app at forge.autodesk.com (this service is for free)
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-06-14: Initial Version
   -------------------------------------------------------------------------------------------------------- */


//Options
let wsId        = '57';
let dmsId       = '14477';

const axios     = require('axios');
const f3m       = require('../node_modules_adsk/f3m.js');
const utils     = require('../node_modules_adsk/utils.js');
const settings  = require('../settings.js');


utils.printStart([ ['Workspace', wsId], ['DMSID', dmsId] ]);

f3m.login().then(function() {
    getAttachments(function(attachments) {
        getViewables(attachments, function() {
            utils.printEnd();
        });

    });
});


function getAttachments(callback) {
       
    let url = 'https://' + settings.tenant + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments?asc=name';
    
    axios.get(url, {
        headers : {
            'Accept' : 'application/vnd.autodesk.plm.attachments.bulk+json'
        }
    }).then(function (response) {

        let attachments   = [];

        if(response.data !== '') {

            for(let i = 0; i < response.data.attachments.length; i++) {

                let attachment = response.data.attachments[i];

                if(attachment.type.extension !== null) {
                    if(attachment.type.extension.endsWith('dwf') || attachment.type.extension.endsWith('dwfx')) {
                        attachments.push({
                            'id'            : attachment.id,
                            'description'   : attachment.description,
                            'version'       : attachment.version,
                            'name'          : attachment.resourceName,
                            'user'          : attachment.created.user.title,
                            'type'          : attachment.type.fileType,
                            'extension'     : attachment.type.extension,
                            'status'        : '',
                            'fileUrn'       : '',
                            'token'         : axios.defaults.headers.common['Authorization']
                        });
                    }
                }

            }

        }

        console.log('    Found ' + attachments.length + ' viewables');
        console.log();

        callback(attachments);

    }).catch(function (error) {
        console.log(' > getAttachments ERROR');
        console.log(error);    
    });    
    
}

function getViewables(attachments, callback) {

    let requests = [];

    axios.defaults.headers.common.Accept = 'application/vnd.autodesk.plm.attachment.viewable+json';

    for(attachment of attachments) {
        requests.push(axios.get('https://' + settings.tenant  + '.autodeskplm360.net/api/v3/workspaces/' + wsId + '/items/' + dmsId + '/attachments/' + attachment.id));
    }

    Promise.all(requests).then(function(responses) {
        for(response of responses) {
            console.log(response.data);
        }
        callback();
    });   
    
}
// IMPORT FILES TO ATTACHMENTS TAB OF EXISTING RECORDS 
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// Set options in file /options/import-files.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2023-01-26: Replacement of API calls with f3m library & bugfixes
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2021-05-14: Fixed bug when searching matches
    - 2021-04-19: Initial Version
    -------------------------------------------------------------------------------------------------------- */



const options   = require('./options/import-files.js');
const settings  = require('../settings.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');
const fs        = require('fs');


utils.printStart([
    [ 'Folder' , options.pathFiles],
    [ 'Success Folder', options.pathSuccess],
    [ 'Failure Folder', options.pathFailure],
    [ 'Workspace ID', options.workspaceId],
    [ 'Field ID', options.fieldId],
    [ 'Include Suffix', options.includeSuffix],
    [ 'Attachments Folder', options.attachmentsFolderName],
    [ 'Search Mode', options.searchMode],
    [ 'Error on multiple results', options.errorOnMultipleResults],
    [ 'Update Existing Files' , options.updateExistingFiles]
]);


let filesList       = [];
let counter         = 1;
let countAll        = 0;
let countFailure    = 0;
let countSuccess    = 0;
let pathLog         = utils.getLogFilePath('Import to ' + settings.tenant.toUpperCase());


// START
if(fs.existsSync(options.pathFiles)) {
    utils.createFolder(options.pathSuccess, true).then(function() {
        utils.createFolder(options.pathFailure, true).then(function() {
            scanFolder();
        });
    });
} else {
    printMessage('Source Folder ' + options.pathFiles + ' does not exist');
}

function scanFolder() {

    fs.readdir(options.pathFiles, function (err, files) {
    
        if (err) {
        
            printEnd('Unable to scan directory ' + options.pathFiles);

        } else {
            
            files.forEach(function (file) {
                if(!fs.lstatSync(options.pathFiles + '/' + file).isDirectory()) {
                    if(file.indexOf('.') > 0) {
                        filesList.push(file);
                    }
                }
            });
            
            printMessage('Found ' + filesList.length + ' files to import');
            
            countAll = filesList.length;
            
            if(filesList.length > 0) {
                f3m.login().then(function() {
                    nextFile(0);
                });
            } else {
                printEnd('');
            }
            
        }
        
    });


}


   

// Process files in folder
function nextFile(offset) {
 
    printMessage('');
    
    if(filesList.length === 0) {
        
        printMessage('   Processed files in total : ' + (countSuccess + countFailure));
        printMessage('         Successful uploads : ' + countSuccess + ' files');
        printMessage('             Failed uploads : ' + countFailure + ' files');
        printEnd('');
            
    } else {
           
        printMessage('');
        printMessage('Processing file #' + counter++ + ' of ' + countAll + ' : ' + filesList[0]);
        printLine();
        findItem(filesList[0], offset);
        
    }
    
}
function findItem(fileName, offset) {
    
    let name = fileName;
    let index = fileName.indexOf('.');

    if(options.includeSuffix === 'none') {
        name  = fileName.substring(0, index);
    } else if(options.includeSuffix === 'first') {
        let suffixes = fileName.substring(index + 1).split('.');
        name  = fileName.substring(0, index);
        name += '.';
        name += suffixes[0];
    }

    let revision     = '1';
    
    switch(options.searchMode) {
        case 'Latest'   : revision = '1'; break;
        case 'latest'   : revision = '1'; break;
        case 'All'      : revision = '2'; break;
        case 'all'      : revision = '2'; break;
        case 'Working'  : revision = '3'; break;
        case 'working'  : revision = '3'; break;
    }

    let params = {
        'query'     : 'ITEM_DETAILS:' + options.fieldId + '%3D%22' + name + '%22',
        // 'query'     : 'ITEM_DETAILS:' + options.fieldId + '%3D%22' + encodeURI(name) + '%22',
        'wsId'      : options.workspaceId,
        'limit'     : 5,
        'offset'    : 0,
        'revision'  : revision 
    }

    printMessage('Searching for matching item (' + options.fieldId + '=' + name + ')');

    f3m.query(params).then(function (data) {

        if(data === '') {
            
            printMessage('ERROR : Could not find matching record');
            printMessage('Moving file to ' + options.pathFailure);

            fs.rename(options.pathFiles + '/' + fileName, options.pathFailure + '/' + fileName, function() {
                filesList.splice(0, 1);
                countFailure++;
                nextFile(0);
            });

        } else {

            printMessage('Found ' + data.items.length + ' matching record(s)');
            
            if((options.errorOnMultipleResults) && (response.data.items.length > 1)) {
                        
                printMessage('ERROR : Skipping file upload as defined per setting errorOnMultipleResults');
                printMessage('Moving file to ' + options.pathFailure);
                    
                fs.rename(options.pathFiles + '/' + fileName, options.pathFailure + '/' + fileName, function() {
                    filesList.splice(0, 1);
                    countFailure++;
                    nextFile(0);
                });
                        
            } else {
                        
                processResults(fileName, data.items, 0, data.totalCount);
                        
            }

        }

    });
    
}
function processResults(fileName, results, index, totalCount) {

    if(index < results.length) {
        processResult(fileName, results, index, function() {
            processResults(fileName, results, index+1, totalCount);
        });
    } else if(index < (totalCount - 1)) {
        nextFile(index);
    } else {
        printMessage('Moving file to ' + options.pathSuccess);
        fs.rename(options.pathFiles + '/' + fileName, options.pathSuccess + '/' + fileName, function() {
            filesList.splice(0, 1);
            countSuccess++;
            nextFile(0);
        });

    }
}
function processResult(fileName, results, index, callback) {
    
    printMessage('Updating ' + results[index].descriptor);
    
    let link        = results[index].__self__;
    let fileId      = '';

    printMessage('  | Getting list of existing attachments');

    f3m.getAttachments(null, null, link).then(function(response) {

        printMessage('  | Found ' + response.attachments.length + ' attachments');

        let proceed = true;

        for(attachment of response.attachments) {
            if(attachment.name === fileName) {
                fileId = attachment.id;
                if(options.updateExistingFiles) {
                    printMessage('  | Creating new version as file exists already');
                    break;
                }
                else {
                    printMessage('  | EXISTS : Skipping file upload as defined per setting updateExistingFiles'); 
                    proceed = false;
                    break;
                }
            } else {
                printMessage('  | Creating new file record');
            }
        }
        
        if(proceed) {
            f3m.uploadFile(link, options.pathFiles, fileName, options.attachmentsFolderName, options.updateExistingFiles).then(function() {
                callback();
            });
        } else {
            callback();
        }

    });
    
}



// Basic Functionality
function printMessage(message) {
    
    message = '    ' + message;
    
    console.log(message);
    fs.appendFileSync(pathLog, message + '\r\n');
    
}
function printLine() {
    console.log('   ---------------------------------------------------------------------------------');
    fs.appendFileSync(pathLog, '   ---------------------------------------------------------------------------------\r\n');
}
function printError(error) {
    console.log(error.message);
    fs.appendFileSync(error.message);
}
function printEnd(message) {
        
    if(message !== '')  console.log('    ' + message);
    console.log();
    console.log('   ************************************** END **************************************');
    console.log();   
    
    if(message !== '')  fs.appendFileSync(pathLog, '    ' + message + '\r\n');
    fs.appendFileSync(pathLog, '\r\n');
    fs.appendFileSync(pathLog, '   ************************************** END **************************************\r\n');
    fs.appendFileSync(pathLog, '\r\n');
    
}
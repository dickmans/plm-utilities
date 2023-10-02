// QUERY FOR PROJECTS TO SYNC AND THEN COPY RELEASED ITEMS INCLUDING BOM AND FILES
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// In addition, set options in file /options.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-10-07: Update to align with Engineering BOM Management app and standard tenant
    - 2022-07-22: Manage project end items in multi-picklist instead of BOM tab
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-01-27: Initial Version
   -------------------------------------------------------------------------------------------------------- */


const options   = require('./options.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');
const upc       = require('../node_modules_adsk/upc.js');

let requestsCount   = 5;
let projects        = [];
let endItems        = [];
let dmsIdProject, pdmProjectId, items, sectionIdEndItems, sections, updateEndItems;

utils.printStart([ 
    ['Project Workspace ID', options.wsIdProjects], 
    ['Items Workspace ID', options.wsIdItems], 
    ['Project Status', options.statusProjects], 
    ['Upchain Item Released Status', options.itemReleasedStatus], 
    ['Downloads Folder', options.folderDownloads] 
]);

utils.createFolder(options.folderDownloads);



// MAIN: LOGIN TO F3M AND UPCHAIN
Promise.all([
    f3m.login(false),
    upc.login()
]).then(function() {

    let params = {
        'wsId' : options.wsIdProjects,
        'fields' : [ 
            { fieldID : 'PDM_OBJECT_ID', fieldTypeID : 0 },
            { fieldID : 'END_ITEMS', fieldTypeID : 0 },
            { fieldID : 'WF_CURRENT_STATE', fieldTypeID : 1 },
            { fieldID : 'DESCRIPTOR', fieldTypeID : 15 } 
        ],
        'filter' : [{
            fieldID : 'WF_CURRENT_STATE',
            fieldTypeID : '1',
            filterType : { filterID : '3' },
            filterValue : options.statusProjects
        },{
            fieldID : 'PDM_OBJECT_ID',
            fieldTypeID : '0',
            filterType : { filterID : '21' },
            filterValue : ''
        }],
        'sort' : [{
            fieldID        : 'PDM_OBJECT_ID',
            fieldTypeID    : 0,
            sortDescending : false
        }]
    }

    console.log('    Searching for records in workspace ' + options.wsIdProjects + ' in status ' + options.statusProjects);

    f3m.search(params).then(function(response) {
        
        console.log();
        console.log('    Found ' + response.totalResultCount + ' project(s) in PLM to process');
        console.log();
        
        projects = response.row;

        if(projects.length > 0) {
            Promise.all([
                f3m.getWorkspaceSectionsFields(options.wsIdItems),
                f3m.getFieldSectionId(options.wsIdProjects, 'PDM_OBJECT_ID')
            ]).then(function(responses) {
                sections = responses[0];
                sectionIdEndItems = responses[1];
                console.log();
                processNextProject();
            });
        } else {
            processNextProject();
        }

    });

}).catch(function(error) {});


// Project Projects and Items
function processNextProject() {

    if(projects.length === 0) {
        utils.printEnd();
        return;
    }

    pdmProjectId    = '';
    dmsIdProject    = projects[0].dmsId;
    items           = [];
    endItems        = [];
    updateEndItems  = false;
    let descriptor  = '';

    for(field of projects[0].fields.entry) {
             if(field.key === 'PDM_OBJECT_ID') pdmProjectId = field.fieldData.value;
        else if(field.key === 'DESCRIPTOR') descriptor = field.fieldData.value;
        else if(field.key === 'END_ITEMS') {
            if(field.fieldData.hasOwnProperty('selections')) {
                for(selection of field.fieldData.selections) {
                    endItems.push(Number(selection.value));
                }
            }
        }
    }

    console.log();
    utils.printLine();
    console.log('    Processing project ' + descriptor);
    utils.printLine();

    let params = {
        'projectId' : pdmProjectId,
        'filter'    : 'LATEST_RELEASE'
    }

    upc.getProjectEndItems(params).then(function(data) {

        for(item of data) {
            if(item.state === options.itemReleasedStatus) {

                items.push({
                    'id'            : item.id,
                    'masterId'      : item.masterId,
                    'projectId'     : pdmProjectId,
                    'name'          : item.name,
                    'description'   : item.description,
                    'type'          : item.type,
                    'state'         : item.state,
                    'uom'           : item.unitOfMeasure,
                    'majorRevision' : item.majorRevision,
                    'minorRevision' : item.minorRevision,
                    'revisionNote'  : item.revisionNote,
                    'state'         : item.state,
                    'creationDate'  : item.creationDate,
                    'material'      : item.material,
                    'spare'         : item.recommendedSpare,
                    'cost'          : '',
                    'material'      : '',
                    'fileVersionId' : '',
                    'designer'      : '',
                    'fileName'      : '',
                    'modified'      : '',
                    'bom'           : [],
                    'sync'          : 'master',
                    'endItem'       : true,
                    'dmsId'         : '',
                    'projectLink'   : { 'link': '/api/v3/workspaces/' + options.wsIdProjects + '/items/' + dmsIdProject }
                });
            }
        }

        console.log('    End items to process in this project : ' + items.length);

        processItems();

    });


}
function processItems() {

    let nextItemMaster     = null;
    let nextItemBOM        = null;
    let nextItemFiles      = [];
    let nextItemDownloads  = [];
    let nextItemUploads    = [];
    let nextImageDownloads = [];
    let nextImageUploads   = [];

    // Determine next item & action
    for(item of items) {
        if(item.sync === 'master') {
            nextItemMaster = item;
            break;
        } else if(item.sync === 'bom') {
            if(nextItemBOM === null) nextItemBOM = item;
        } else if(item.sync === 'files') {
            if(nextItemFiles.length < requestsCount) nextItemFiles.push(item);
        } else if(item.sync === 'download') {
            if(nextItemDownloads.length < requestsCount) nextItemDownloads.push(item);
        } else if(item.sync === 'upload') {
            if(nextItemUploads.length < 1) nextItemUploads.push(item);
        } else if(item.sync === 'image-download') {
            if(nextImageDownloads.length < 1) nextImageDownloads.push(item);
        } else if(item.sync === 'image-upload') {
            if(nextImageUploads.length < 1) nextImageUploads.push(item);
        }
    }


    // Perform given action
    if(nextItemMaster !== null) { 
        console.log();
        processItemMaster(nextItemMaster); } 
    else if(updateEndItems && (endItems.length > 0)) { 
        console.log();
        console.log('    > Setting end items of PLM project');
        setEndItems(); } 
    else if(nextItemBOM !== null) { 
        console.log();
        console.log('    > Copying BOM entry of ' + nextItemBOM.name + ' to PLM');
        processItemBOM(nextItemBOM); } 
    else if(nextItemFiles.length      > 0) { console.log(); processItemFiles(nextItemFiles); } 
    else if(nextItemDownloads.length  > 0) { console.log(); processItemDownloads(nextItemDownloads); }
    else if(nextItemUploads.length    > 0) { console.log(); processItemUploads(nextItemUploads); } 
    else if(nextImageDownloads.length > 0) { console.log(); processImageDownloads(nextImageDownloads); } 
    else if(nextImageUploads.length   > 0) { console.log(); processImageUploads(nextImageUploads); } 
    else {
        projects.splice(0, 1);
        processNextProject();
    } 

}


// Retrieve item details and create matching records in PLM
function processItemMaster(item) {

    let paramsSearch = {
        'wsId' : options.wsIdItems,
        'fields' : [ 
            { fieldID: 'PDM_OBJECT_ID'   , fieldTypeID:  0 },
            { fieldID: 'PDM_MASTER_ID' , fieldTypeID:  0 },
            { fieldID: 'DESCRIPTOR', fieldTypeID: 15 } 
        ],
        'filter' : [{
            fieldID     : 'PDM_MASTER_ID',
            fieldTypeID : '0',
            filterType  : { filterID: '15' },
            filterValue : item.masterId.toString()
        }],
        'sort' : [{
            fieldID        : 'PDM_MASTER_ID',
            fieldTypeID    : 0,
            sortDescending : false
        }]
    }

    let requests = [
        f3m.search(paramsSearch),
        upc.getItemEBOM(item.id, pdmProjectId, 1, 'AS_SAVED')
    ];

    if(item.endItem === true) {
        requests.push(upc.getPrimaryFile(item.id));
        requests.push(upc.getItemDetails(item.id));
    }

    Promise.all(requests).then(function(responses){

        if(responses[0].totalResultCount === 0) {

            console.log('    > Creating new PLM item for ' + item.name);

            for(bomItem of responses[1]) {
                addItem(bomItem);
                item.bom.push({
                    'id'        : bomItem.id,
                    'quantity'  : bomItem.quantity
                });
            }

            if(responses.length > 2) {
                if(typeof responses[2] !== 'undefined') {
                    item.fileVersionId  = responses[2].PbFileVersionId;
                    item.designer       = responses[2].Creator;
                    item.fileName       = responses[2].FileName;
                    item.modified       = responses[2].Date;
                }
                item.itemNumber = responses[3].itemNumber;
            }

            let paramsCreate = { 'wsId' : options.wsIdItems, 'sections' : genPayloadSections(item) }

            f3m.createItem(paramsCreate).then(function(link) {
                
                item.dmsId = link.split('/')[8];
                item.link  = link.split('.autodeskplm360.net')[1];
                item.sync  = 'bom';

                console.log('    > DMS ID of new PLM item : ' + item.dmsId);

                if(item.endItem === true) {
                    endItems.push(item.dmsId);
                    updateEndItems = true;
                }

                processItems();

            });

        } else {

            console.log('    > Skipping item ' + item.name + ' as it is in sync already');

            item.dmsId = responses[0].row[0].dmsId;
            item.sync  = 'done';

            if(item.endItem === true) {
                if(endItems.indexOf(item.dmsId) < 0) {
                    endItems.push(item.dmsId);
                    updateEndItems = true;
                }
            }

            processItems();

        }    

    });

}
function addItem(newItem) {

    for(listItem of items) {
        if(listItem.id ===  newItem.id) {
            return;
        }
    }             
    
    let cost = (newItem.actCost === null) ? newItem.estCost : newItem.actCost;

    // console.log(newItem);

    items.push({
        'itemNumber'        : newItem.itemNumber,
        'name'              : newItem.name,
        'description'       : newItem.description,
        'type'              : newItem.partType,
        'releaseMaturity'   : newItem.releaseMaturity,
        'id'                : newItem.id,
        'masterId'          : newItem.partMasterId,
        'projectId'         : pdmProjectId,
        'creatorFullName'   : newItem.creatorFullName,
        'releaseType'       : newItem.releaseType,
        'revisionNote'      : newItem.revisionNote,
        'projectLink'       : { 'link' : '/api/v3/workspaces/' + options.wsIdProjects + '/items/' + dmsIdProject }, 
        'respDesigner'      : newItem.respDesigner,
        'cost'              : cost,
        'uom'               : newItem.uom,
        'creationDate'      : newItem.creationDate,
        'modificationDate'  : newItem.modificationDate,
        'notes'             : newItem.notes,
        'material'          : newItem.material,
        'weight'            : newItem.weight,
        'spare'             : newItem.spare,
        'recommendedSpare'  : newItem.recommendedSpare,
        'modelFileName'     : newItem.modelFileName,
        'modelFileVersion'  : newItem.modelFileVersion,
        'drawingFileName'   : newItem.drawingFileName,
        'drawingFileVersion': newItem.drawingFileVersion,
        'manufacturer'      : newItem.manufacturer,
        'manPartNum'        : newItem.manPartNum,
        'manufacturerDescription' : newItem.manufacturerDescription,
        'majorRevision'     : newItem.partMajorRevision,
        'minorRevision'     : newItem.partMinorRevision,
        'state'             : newItem.status,
        'fileName'          : newItem.modelFileName,
        'fileVersion'       : newItem.modelFileVersion,
        'fileVersionId'     : newItem.modelFileVersionId,
        'bom'               : [],
        'endItem'           : false,
        'sync'              : 'master',
        'dmsId'             : ''
    });

}
function genPayloadSections(item) {

    let result = [];

    for(mapping of options.mappings) {
        if(typeof item[mapping[1]] !== 'undefined'){
            if(item[mapping[1]] !== null) {

                if(mapping[0].endsWith('_DATE')) {
                    item[mapping[1]] = item[mapping[1]].split('T')[0];
                }

                let found = false;
                for(section of sections) {
                    let sectionId = section.urn.split('.')[5];
                    for(field of section.fields) {
                        let fieldId = field.urn.split('.')[7];
                        if(fieldId === mapping[0]) {
                            let newSection = true;
                            found = true;
                            for(entry of result) {
                                if(entry.id === sectionId) {
                                    newSection = false;
                                    entry.fields.push({
                                        'fieldId' : fieldId, 'value' : item[mapping[1]]
                                    });
                                    break;
                                }
                            }
                            if(newSection) {
                                result.push({
                                    'id' : sectionId,
                                    'fields' : [{
                                        'fieldId' : fieldId, 'value' : item[mapping[1]]
                                    }]
                                })
                            }
                        }
                    }
                    if(!found) {
                        if(section.hasOwnProperty('matrices')) {
                            for(matrix of section.matrices) {
                                for(row of matrix.fields) {
                                    for(field of row) {
                                        let fieldId = field.urn.split('.')[7];
                                        if(fieldId === mapping[0]) {
                                            let newSection = true;
                                            found = true;
                                            for(entry of result) {
                                                if(entry.id === sectionId) {
                                                    newSection = false;
                                                    entry.fields.push({
                                                        'fieldId' : fieldId, 'value' : item[mapping[1]]
                                                    });
                                                    break;
                                                }
                                            }
                                            if(newSection) {
                                                result.push({
                                                    'id' : sectionId,
                                                    'fields' : [{
                                                        'fieldId' : fieldId, 'value' : item[mapping[1]]
                                                    }]
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return result;

}


// Set project end items
function setEndItems() {

    let list = [];

    for(endItem of endItems) {
        list.push({ 'link' : '/api/v3/workspaces/' + options.wsIdItems + '/items/' + endItem});
    }

    let params = {
        'dmsId' : dmsIdProject,
        'wsId' : options.wsIdProjects,
        'sections' : [{
            'id' : sectionIdEndItems,
            'fields' : [
                { 'fieldId' : 'END_ITEMS', 'value' : list }
            ]
        }]
    }

    f3m.edit(params).then(function() {
        endItems = [];
        processItems();
    });

}



// Create matching BOM in PLM
function processItemBOM(item) {

    let promises = [];

    for(bomItem of item.bom) {

        if(promises.length >= requestsCount) break;

        let paramsBomItem = {
            'wsIdParent'    : options.wsIdItems,
            'dmsIdParent'   : item.dmsId,
            'pinned'        : false,
            'qty'           : bomItem.quantity,
            'wsIdChild'     : options.wsIdItems
        }

        for(listItem of items) {
            if(listItem.id === bomItem.id) {
                paramsBomItem.dmsIdChild = listItem.dmsId;
                break;
            }
        }

        promises.push(f3m.addBomItem(paramsBomItem));

    }

    if(promises.length > 0) {
        Promise.all(promises).then(function(data) {
            item.bom.splice(0, promises.length);
            if(item.bom.length === 0) item.sync = 'files';
            processItems();
        });
    } else {
        item.sync = 'files';
        processItems();
    }

}


// Get file information
function processItemFiles(items) {

    let promises = [];

    for(item of items) {
       
        if(item.fileVersionId !== '' && item.fileVersionId !== 0) {
            promises.push(upc.getFileTranslations(item.fileVersionId));
            console.log('    > Getting files list of ' + item.name + ' (fileVersionId : ' + item.fileVersionId + ')');
            item.sync = 'download';
        } else {
            item.sync = 'image-download';
        }
    }

    if(promises.length === 0) {
        processItems();
    } else {

        Promise.all(promises).then(function(responses) {

            for(let i = 0; i < items.length; i++) {

                for(file of responses[i]) {

                    let fileName = file.fileName;
                    let temp     = fileName.split('.');
                    let suffix   = temp[temp.length - 1];

                    let fileDetails = {
                        'fileName'      : file.fileName,
                        'fileVersionId' : file.fileVersionId
                    }

                        if(suffix === 'PNG' ) items[i].fileImage = fileDetails;
                    else if(suffix === 'STEP') items[i].fileSTEP  = fileDetails;

                }

            }

            processItems();

        });
    }

}


// Download STEP files from Upchain
function processItemDownloads(items) {

    let promises = [];

    for(item of items) {
        
        item.sync = 'upload';

        if(typeof item.fileSTEP !== 'undefined') {
            console.log('    > Downloading STEP files of ' + item.name);
            promises.push(upc.downloadFile(item.fileSTEP.fileVersionId, item.fileSTEP.fileName, options.folderDownloads));
        }
    }

    if(promises.length === 0) {
        processItems();
    } else {
        Promise.all(promises).then(function() {
            processItems();
        });
    }

}


// Upload files to PLM
function processItemUploads(items) {

    let promises   = [];
    let folderName = '';

    for(item of items) {

        console.log('    > Uploading files of ' + item.name + ' to PLM');
        item.sync = 'image-download';
        promises.push(f3m.uploadFile(item.link, options.folderDownloads, item.fileSTEP.fileName, folderName));

    }

    if(promises.length === 0) {
        processItems();
    } else {
        Promise.all(promises).then(function() {
            processItems();
        });
    }

}


// Download IMAGE files from Upchain
function processImageDownloads(items) {

    let promises = [];

    for(item of items) {
        if(typeof item.fileImage !== 'undefined' && item.fileImage !== '') {

            console.log('    > Downloading image of ' + item.name);
            item.sync = 'image-upload';
            promises.push(upc.downloadFile(item.fileImage.fileVersionId, item.fileImage.fileName, options.folderDownloads));
        } else {
            item.sync = 'done';
        }
    }

    if(promises.length === 0) {
        processItems();
    } else {
        Promise.all(promises).then(function() {
            processItems();
        });
    }

}


// Upload images to PLM
function processImageUploads(items) {

    let promises   = [];

    for(item of items) {
        
        console.log('    > Uploading image of ' + item.name + ' to PLM');
        item.sync = 'done';

        promises.push(f3m.uploadImage({
            'fieldId'   : 'THUMBNAIL',
            'folder'    : options.folderDownloads,
            'fileName'  : item.fileImage.fileName,
            'wsId'      : options.wsIdItems,
            'dmsId'     : item.dmsId
        }));

    }

    Promise.all(promises).then(function() {
        processItems();
    });

}
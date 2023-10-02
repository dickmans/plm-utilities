// QUERY FOR NEW PROJECTS IN FUSION 360 MANAGE AND CREATE MATCHING PROJECT IN UPCHAIN
// Please provide clientId and clientSecret of your Forge app in file settings.js before 
// In addition, set options in file /options.js
// Author: Sven Dickmans, Autodesk

/* --------------------------------------------------------------------------------------------------------
    Change Log
    - 2022-10-07: Update to align with Engineering BOM Management app and standard tenant
    - 2022-02-16: Integration in TS F3M Extensions Package
    - 2022-02-08: Alignment with item sync
    - 2022-01-26: Initial Version
   -------------------------------------------------------------------------------------------------------- */


const options   = require('../upchain-connector/options.js');
const utils     = require('../node_modules_adsk/utils.js');
const f3m       = require('../node_modules_adsk/f3m.js');
const upc       = require('../node_modules_adsk/upc.js');

let projects         = [];
let paramsNewProject = {};
let sectionId;

utils.printStart([ 
    ['Project Workspace ID', options.wsIdProjects], 
    ['Project Status', options.statusProjects], 
    ['Upchain Project Type', options.projectType],
    ['Upchain Project Workflow', options.workflowName]
]);



// MAIN: LOGIN TO F3M AND UPCHAIN
Promise.all([
    f3m.login(false),
    upc.login()
]).then(function() {

    let params = {
        'wsId' : options.wsIdProjects,
        'fields' : [ 
            { fieldID: 'IDPRJ', fieldTypeID: 0 },
            { fieldID: 'TITLE', fieldTypeID: 0 },
            { fieldID: 'DESCRIPTION', fieldTypeID: 0 },
            { fieldID: 'PDM_OBJECT_ID', fieldTypeID: 0 },
            { fieldID: 'WF_CURRENT_STATE', fieldTypeID: 1 },
            { fieldID: 'DESCRIPTOR', fieldTypeID: 15 } 
        ],
        'filter' : [{
            fieldID: 'WF_CURRENT_STATE',
            fieldTypeID: '1',
            filterType: { filterID: '3' },
            filterValue: options.statusProjects
        },{
            fieldID: 'PDM_OBJECT_ID',
            fieldTypeID: '0',
            filterType: { filterID: '20' },
            filterValue : ''
        }],
        'sort' : [
            { fieldID: 'IDPRJ', fieldTypeID: 0 }
        ]
    }

    let promises  = [
        upc.getCustomerId(options.upcTenant),
        upc.getProjectTypeId(options.projectType),
        upc.getWorkflowId(options.workflowName),
        f3m.search(params)
    ];

    Promise.all(promises).then(function(responses){

        paramsNewProject.customerId     = responses[0];
        paramsNewProject.projectTypeId  = responses[1];
        paramsNewProject.workflowId     = responses[2];
        projects                        = responses[3].row;

        console.log();
        console.log('    Found ' + responses[3].totalResultCount + ' projects to process in F3M');
        console.log();

        if(responses[3].totalResultCount > 0) {
            f3m.getFieldSectionId(options.wsIdProjects, 'PDM_OBJECT_ID').then(function(id) {
                sectionId = id;
                console.log();
                processProjects();
            });
        } else {
            processProjects();
        }

    });

}).catch(function() {});


// Loop across projects found
function processProjects() {
    
    if(projects.length > 0) {
        processNextProject();
    } else {
        utils.printEnd();
    }

}


// Create Upchain project and update F3M Project
function processNextProject() {

    paramsNewProject.key         = '';
    paramsNewProject.num         = '';
    paramsNewProject.name        = '';
    paramsNewProject.description = '';

    let descriptor = '';

    for(field of projects[0].fields.entry) {
             if(field.key === 'IDPRJ'      ) paramsNewProject.num         = field.fieldData.value;
        else if(field.key === 'TITLE'      ) paramsNewProject.name        = field.fieldData.value;
        else if(field.key === 'DESCRIPTION') paramsNewProject.description = field.fieldData.value;
        else if(field.key === 'DESCRIPTOR' ) descriptor                   = field.fieldData.value;
    }

    let key     = paramsNewProject.num;
    let length  = key.length;

    if(length > 4) key = key.substring(length - 4, length);

    paramsNewProject.key = key;

    console.log('    > Initiating new project in Upchain : ' + descriptor);

    upc.createProject(paramsNewProject).then(function(data) {

        f3m.edit({
            'wsId' : options.wsIdProjects,
            'dmsId' : projects[0].dmsId,
            'sections' : [{
                'id' : sectionId,
                'fields' : [
                    { 'fieldId' : 'PDM_OBJECT_ID', 'value' : data.id }
                ]
            }]
        }).then(function() {
            projects.splice(0, 1);
            processProjects();
        });

    });

}
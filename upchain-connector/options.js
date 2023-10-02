// UPCHAIN CONNECTION SETTINGS
// -------------------------------------------------------------------------------------------------------
exports.upcClientId        = '';   // Upchain Client ID
exports.upcClientSecret    = '';   // Upchain Client Secret
exports.upcTenant          = '';   // Upchain Tenant Name
exports.upcUsername        = '';   // Upchain Username
exports.upcPassword        = '';   // Password of Upchain user


// UPCHAIN SCHEMA SETTINGS
// -------------------------------------------------------------------------------------------------------
exports.projectType         = 'Engineering';        // Type of new projects to be created in Upchain
exports.workflowName        = 'Project activation'; // Workflow to use for new projects
exports.itemReleasedStatus  = 'Released';           // Status of items to be copied


// FUSION 360 MANAGE SCHEMA SETTINGS
// -------------------------------------------------------------------------------------------------------
exports.wsIdItems           = '439';            // Engineering Items Workspace ID
exports.wsIdProjects        = '86';             // Projects Workspace ID
exports.statusProjects      = 'Specification';  // Project status triggering the UPC project creation


// GENERAL SETTINGS
// -------------------------------------------------------------------------------------------------------
exports.folderDownloads    = 'Downloads';   // Local folder being used to download/upload files to F3M


// PROPERTY MAPPING
// -------------------------------------------------------------------------------------------------------
exports.mappings = [

    // Basics
    ['NUMBER', 'itemNumber'],
    ['NAME', 'name'],
    ['DESCRIPTION', 'description'],
    ['TYPE', 'type'],
    ['PDM_MATURITY', 'releaseMaturity'],
    ['PDM_OBJECT_ID', 'id'],
    ['PDM_MASTER_ID' , 'masterId'],
    ['PDM_PROJECT_ID', 'projectId'],
    
    // Revision
    ['REVISED_BY', 'creatorFullName'],
    ['RELEASE_TYPE', 'releaseType'],
    ['REVISION_NOTE', 'revisionNote'],

    // Details
    ['PROJECT', 'projectLink'],
    ['RESPONSIBLE_DESIGNER', 'respDesigner'],
    ['COST', 'cost'],
    ['UNIT_OF_MEASURE', 'uom'],
    ['CREATION_DATE', 'creationDate'],
    ['MODIFICATION_DATE', 'modificationDate'],
    ['NOTES', 'notes'],

    // Technical Specification
    ['MATERIAL', 'material'],
    ['MASS', 'weight'],
    ['SPARE', 'spare'],
    ['RECOMMENDED_SPARE', 'recommendedSpare'],

    // CAD Files
    ['MODEL_FILE_NAME'      , 'modelFileName'],
    ['MODEL_FILE_VERSION'   , 'modelFileVersion'],
    ['DRAWING_FILE_NAME'    , 'drawingFileName'],
    ['DRAWING_FILE_VERSION' , 'drawingFileVersion'],

    // Manufacturer
    ['MANUFACTURER' , 'manufacturer'],
    ['MANUFACTURER_ITEM_NUMBER' , 'manPartNum'],
    ['MANUFACTURER_ITEM_DESCRIPTION' , 'manufacturerDescription'],
    
    // Others
    ['MAJOR_REVISION', 'majorRevision'],
    ['MINOR_REVISION', 'minorRevision'],
    ['STATUS_NAME', 'state']

];

/* ----------------------------------------------------------------------------------------------------------------------------------
    Extract Options:
    - folder               : path where to store the output files
    - workspacesIds        : Optional list of workspace IDs to extract (e.g. 9,57,101). Leave blak to export all workspaces.
    - appendDate           : If set to true, runtime date will be appended to folder and file names (true | false)
    - extractScripts       : Option to extract source code of scripts (true | false)
    - extractPicklists     : Option to extract picklist information (true | false)
    - extractSecurity      : Option to extract users, groups and roles information to json files (true | false)
    - extractFields        : Option to extract item details fields definition to json files (true | false)
    - extractGrid          : Option to extract grid columnss definition to json files (true | false)
    - extractManagedItems  : Option to extract managed items columns definition to json files (true | false)
    - extractWorkflow      : Option to extract workflow states and transition definition to json files (true | false)
    - limitSystemLog       : Defines number of latest system log entries to be extracted (set it to 0 to disable this feature)
    - limitSetupLog        : Defines number of latest setup log entries to be extracted (set it to 0 to disable this feature)
    - createExcelFile      : If set to false, the Excel file with workspace information will not be created (true | false)

    IMPORTANT: Make sure that the defined user has access to all workspaces of your tenant and is member of group Hidden Sections
     
  ---------------------------------------------------------------------------------------------------------------------------------- */

exports.folder                  = '/tmp/export';
exports.workspaceIds            = '';
exports.appendDate              = true;
exports.extractScripts          = true;
exports.extractPicklists        = true;
exports.extractSecurity         = true;
exports.extractFields           = true;
exports.extractGrid             = true;
exports.extractManagedItems     = true;
exports.extractWorkflow         = true;
exports.limitSystemLog          = 0;
exports.limitSetupLog           = 0;
exports.createExcelFile         = true;
// OPTIONS FILE USED BY import-files.js

exports.pathFiles               = '/tmp/files';         // where to find the files to be imported
exports.pathSuccess             = '/tmp/files/success'; // where to move the files that have been processed successfully
exports.pathFailure             = '/tmp/files/failure'; // where to move the files that could not be processed successfully
exports.workspaceId             = 57;                   // Target workspace to import the files to (57 matches the default Items & BOMs workspace)
exports.fieldId                 = 'NUMBER';             // Field to match the filename
exports.includeSuffix           = 'none'                // Include file suffix when searching PLM record (none, first, last)
exports.attachmentsFolderName   = '';                   // Upload files to defined folder within Attachments tab
exports.searchMode              = 'All';                // Which revisions should be updated (Latest, Working or All)? Default is Latest
exports.errorOnMultipleResults  = false;                // Consider it an error if multiple matching records are found and prevent file upload?
exports.updateExistingFiles     = false;                // Upload file as new version if file exists already?
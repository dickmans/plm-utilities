// OPTIONS BEING USED BY transition-records.js

exports.workspaceId      = 82;              // workspace holding the records to update (82 equals to workspace Problem Reports in default tenant)
exports.fromStatus       = 'Create';        // Status of records to transition
exports.transitionId     = '523';           // Internal ID of transition to perform (523 matches the transition to move Problem Reports from Create to Review in default tenant)
exports.comment          = 'Transitioned automatically';
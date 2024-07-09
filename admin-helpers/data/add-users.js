// DATA BEING USED BY add-users.js
// [ e-mail, [ Group1, Group2, ...] ]

exports.uom      = 'Metric';     // Set to English or Metric
exports.timezone = 'Etc/GMT+1';  // Set user timezone
exports.license  = '';           // Set this to value for demo/trial tenants which manage licenses internally ( use 'S' for Professional license and 'P' for Participant )

exports.users = [
    ['sven.dickmans@autodesk.com', ['Engineering', 'Quality']],
    ['becky@forge.tools', ['Engineering', 'Quality']],
    ['selena@forge.tools', ['Suppliers']]
]
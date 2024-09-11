# plm-utilities

Disclaimer: In any case all source code of this solution is of "work in progress" character. Neither of the contributors nor Autodesk represent that theses code samples are reliable, accurate, complete, or otherwise valid. Accordingly, those configuration samples are provided “as is” with no warranty of any kind and you use the applications at your own risk. 


### PLM Utilities for Administrators

This set of utilities is based on node.js. It uses the Fusion Manage REST API to automate administrative tasks. With this, it helps reducing implemenation efforts even further. 
Before using this package please have a look at the instructions.pdf which contains the setup instructions.

The following utilities are included in this package:

**API Examples**: Basic node.js code snippets to explore the REST API
**Implementation Helpers**: Utilities for administrators
    1. Add Users: Create multiple users and assign to groups
    2. Touch Records: trigger modifications on given records to invoke the onEdit scripts
    3. Transition Records : Peform a defined workflow transition on multiple records matching a given search criteria
    4. Import Files : Upload files to matching records in PLM
    5. MOW Report : Extract the My Outstanding Work list of another user (being sick for example)
    6. Store DMSID : Store the dmsId for all records in a defined workspace
    7. Disable Users : Prevent future logins for defined users
    8. Validat 2FA : List all users not haveing 2-factor-authentication enabled
**Extract Tenant Configuration** : Document your tenant's configuration and extract script sources automatijcally
**Share Workspace Views** : Share predefined workspaces views with new defined users
**User Logins Report** : Track logins by end users to your tenant
**Demo Reset** : Archive new data after a training or test session
**Excel Export** : Extract standard PLM Report to Excel for reuse in PowerBI
**E-Mail Listener** : Capture information from mails in PLM
**PDF Export** : Convert Avanced Print Views to PDF
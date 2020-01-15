# WeakestLink
Scrapes employees from a LinkedIn company page, performs a number of clean up steps to remove any junk and then generates a range of possible username formats so they can be used in username enumeration and password attacks.

** Use of this extension is against LinkedIn TOS and your account may be restricted. **

Features:
- Option to retrieve headline and subline for each user
- Option to generate short name versions of users for common names such as Jonathan -> John
- Clean up steps
* Normalises any NFD characters for example ó to o
* Removes any none printable ASCII characters
* Downloads a file and removes postnominal's
* Removes any data after a comma or curly bracket
* Removes the dot that follows a hidden surname
* Attempts to identify the first and last name of user
* Identifies any common surname prefixes and appends to surname
* Converts to lowercase and trims any redundant white space

As the first and last name fields on LinkedIn are free form text fields then there can be any random combination of data in them. Please ensure you check over the exported list as there will be dodgy names still

## Chrome Installation

1. From the Chrome store - https://chrome.google.com/webstore/detail/weakestlink/jiobcfhamdgbhhhnkmoblghheddjfnpo  - Recommended as this will auto-update
2. Load unpacked extension
    * Clone repository
    * Browse to "chrome://extensions/"
    * Enable Developer mode
    * Click Load Unpacked extension and select the folder where you cloned the repository to

## Firefox Installation - This is a port from the Chrome version and may still be buggy

1. From the Firefox store - https://addons.mozilla.org/en-US/firefox/addon/weakestlink/ - Recommended as this will auto-update
2. Load unpacked extension - This is unload when browser is closed unless you configure firefox to maintain Temporary Addons
    * Clone repository
    * Browse to "about:debugging"
    * Click Load Temporary Addon and select the manifest.json file from the folder where you cloned the repository to

## Usage

* Sign into LinkedIn
* Browse to the required company page
* Click 'See all ### employees on LinkedIn'
* If there are more than 1000 results (100 pages) then use the filters to reduce the number and run multiple dumps
* Click the WeakestLink icon
* Click the Dump Users button
* The target page will be scraped and will move onto the next page until there are no more results or the max limit is hit.
* Once the scraping is complete a message box will popup and a CSV with containing the results will be downloaded
* If you need to cancel the dump then close the LinkedIn tab

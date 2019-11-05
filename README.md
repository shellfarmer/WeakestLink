# WeakestLink
Scrapes employees from a LinkedIn company page and performs a number of actions to clean up the names so they can be used in enumeration and password attacks.

Firefox support coming soon!

Currently the following clean up actions are performed:

* Normalises any NFD characters for example ó to o
* Removes any none printable ASCII characters
* Downloads a file and removes  postnominal's
* Removes any data after a comma or curly bracket
* Removes the dot that follows a hidden surname
* Attempts to identify the first and last name of user (Might not be great for international companies!)
* Converts to lowercase and trims any redundant white space

As the first and last name fields on LinkedIn are free form text fields then there can be any random combination of data in them. Please ensure you check over the exported list as there will be dodgy names still

## Installation

1. From the Chrome store - https://chrome.google.com/webstore/detail/weakestlink/jiobcfhamdgbhhhnkmoblghheddjfnpo
2. Load unpacked extension
* Download the latest release from https://github.com/shellfarmer/WeakestLink/releases
* Extract archive file to location of your choice
* Browse to "chrome://extensions/"
* Enable Developr mode
* Load Unpacked extension and select the folder where the extracted file are

// Function to allow js to sleep while pages are loaded
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

var userdata = '';
var urls = [];

// This function is called onload in the popup code
function dumpCurrentPage(callback) {
    // Inject the content script into the current page
    console.log('Initial execute');
    chrome.tabs.executeScript(null, {
        file: 'content.js'
    });

    // Listener that recieves messages from injected content.js
    chrome.runtime.onMessage.addListener(function(message) {

        // No more results return data to popup
        if (message.summary.includes('Your search returned no results. Try removing filters or rephrasing your search')) {
            callback(userdata);
            return;
        }

        // Check if url has already been parsed
        if (!urls.includes(message.url)) {

            // parse users and store in userdata
            var people = message.summary.split('<span class=\"name actor-name\">');

            for (var i = 1; i < people.length; i++) {
                var person = people[i].split('</span')[0];
                userdata = userdata.concat(person + ',' + person.toLowerCase().replace(" ", "") + ',' + person.toLowerCase().replace(" ", ".") + '\n');
            }

            //sleep(5000);

            // Increment page to next one
            if (message.url.includes('&page=')) {
                var urlparts = message.url.split('&page=');
                var url = urlparts[0];
                var page = urlparts[1];
                page++;

                var href = url.concat('&page=', page)
            } else {
                var href = message.url.concat('&page=', 2);
            }

            console.log('Gen Next url: ' + href);

            // Set the tab to the require page, update the tab and execute the injected js
            chrome.tabs.query({active: true,currentWindow: true}, function(tabs) {
                var tab = tabs[0];
                console.log('Updating browser with url: ' + href);
                chrome.tabs.update(tab.id, {
                    url: href
                });
                sleep(5000);
                console.log('Execute js on: ' + href);
                chrome.tabs.executeScript(tab.id, {
                    file: 'content.js'
                });
                urls.push(message.url);
            });
        }
    });
};

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
var count = 0;

var finished = '';

var header = 'LinkedIn Name,clean name,first,firstlast,first.last,firstl,f.last,flast,lfirst,l.first,lastf,last,last.f,last.first,fl\n'
userdata = userdata + header


function cancelDump(callback) {
    finished = 'Cancelled';
    callback(userdata, finished, count);
}

function isUpperCase(str) {
    return str === str.toUpperCase();
}

// This function is called onload in the popup code
function dumpCurrentPage(callback, junk, genusers) {
    // Inject the content script into the current page
    console.log('Initial execute');
    chrome.tabs.executeScript(null, {
        file: 'content.js'
    });

    // Listener that recieves messages from injected content.js
    chrome.runtime.onMessage.addListener(function(message) {
        try{
            // No more results return data to popup
            if (message.summary.includes('Your search returned no results. Try removing filters or rephrasing your search')) {
                finished = 'Completed';
                callback(userdata, finished, count);
                return;
            }

            // Check if url has already been parsed
            if (!urls.includes(message.url) && finished === '') {
                // parse users and store in userdata
                var people = message.summary.split('<span class=\"name actor-name\">');

                for (var i = 1; i < people.length; i++) {
                    var person = people[i].split('</span')[0];

                    var username = person.toLowerCase()

                    var nameparts = username.split(' ');
                    var firstname = nameparts[0];
                    var lastname = nameparts[nameparts.length - 1];

                    if(junk){
                        // do junk cleaning


                        if(lastname.includes('(')){
                          // Remove any random bits after curley brackets such as accrediations
                          username = username.split('(')[0];
                          nameparts = username.split(' ');
                          lastname = nameparts[nameparts.length - 1]
                        }

                        // Remove any random bits after commas such as accrediations
                        if(lastname.includes(',')){
                          username = username.split(',')[0];
                          nameparts = username.split(' ');
                          lastname = nameparts[nameparts.length - 1]
                        }

                       // Need way to chop out MSc Bsc Meng etc

                        // Hidden surname (M.) chop off final dot,  need to exclude some some username permitations
                        if(lastname.length == 2 && lastname.charAt(1) == '.'){
                            lastname = lastname.charAt(0);
                        }



                    }

                    if(genusers){

                        // first                anna
                        var user1 = firstname;
                        // firstlast            annakey
                        var user2 = firstname + lastname;
                        // first.last           anna.key
                        var user3 = firstname + '.' + lastname;
                        // firstl               annak
                        var user4 = firstname + lastname.charAt(0);
                        // f.last               a.key
                        var user5 = username.charAt(0) + '.' + lastname;
                        // flast                akey
                        var user6 = username.charAt(0) + lastname;
                        // lfirst               kanna
                        var user7 =  lastname.charAt(0) + firstname;
                        // l.first              k.anna
                        var user8 =  lastname.charAt(0) + '.' + firstname;
                        // lastf                keya
                        var user9 = lastname + firstname.charAt(0);
                        // last                 key
                        var user10 = lastname;
                        // last.f               key.a
                        var user11 =  lastname + firstname.charAt(0);
                        // last.first           key.anna
                        var user12 =  lastname + firstname;
                        // fl                   ak
                        var user13 =  lastname.charAt(0) + firstname.charAt(0);

                        userdata = userdata.concat(person + ',' + username + ',' + user1 + ',' + user2 + ',' + user3 + ',' + user4 + ',' + user5 +  ',' + user6 +  ',' + user7  +  ',' + user8  +  ',' + user9  +  ',' + user10 +  ',' + user11  +  ',' + user12  +  ',' + user13   +'\n');
                    }
                    else {
                        userdata = userdata.concat(person + '\n');
                    }

                    count++;
                }

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
        }
        catch(err)
        {
            finished = 'Error'
            console.log(err)
            callback(userdata, finished, count);

        }
    });
};

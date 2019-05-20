// Function to allow js to sleep while pages are loaded,  seems ineffective...
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function getpn() {
  var url = 'https://raw.githubusercontent.com/shellfarmer/LinkedInUserDump/master/postnominals.txt';
  var pn = [];
  fetch(url)
    .then((resp) => resp.text())
    .then(function(data) {
      var lines = data.split(/\n/);
      for (var i = 0; i < lines.length; i++) {
        // only push this line if it contains a non whitespace character.
        if (/\S/.test(lines[i])) {
          pn.push(lines[i].replace(/\n|\r/g, "").trim());
        }
      }
    });
  return pn;
}

var urls = [];
var count = 0;
var finished = '';
var page = '';
//var postnominals = ['mba', 'msc', 'bsc', 'ma', 'acma', 'cissp', 'crt', 'mcipd', 'certrp', 'sphr', 'acis', 'frsa', 'ba', 'phd', 'cciso'];


var postnominals = []
var filename = '';
var userdata = '';
var shortnames = '';

function cancelDump(callback) {
    finished = 'Cancelled';
    callback(userdata, finished, count, filename);
}

function isUpperCase(str) {
    return str === str.toUpperCase();
}

// This function is called onload in the popup code
function dumpCurrentPage(callback, junk, genusers) {
    postnominals = getpn();
    var header = 'LinkedIn Name';
    if (junk){
      header = 'LinkedIn Name,clean name';
    }
    if (genusers){
      header = 'LinkedIn Name,clean name,first,firstlast,first.last,firstl,f.last,flast,lfirst,l.first,lastf,last,last.f,last.first,fl';
    }

    userdata = header + '\n';

    // Inject the content script into the current page

    sleep(2000);
    chrome.tabs.executeScript(null, {
        file: 'content.js'
    });


    // Listener that recieves messages from injected content.js
    chrome.runtime.onMessage.addListener(function(message) {
        try{
            if(filename == ''){
                filterparts = message.body.split('{"filterValues":[{"displayValue":"');
                for(var i = 1; i < filterparts.length; i++){
                  filename = filename + '-' + filterparts[i].split('"')[0];
                }
            }

            // No more results return data to popup
            if (message.body.includes('Your search returned no results. Try removing filters or rephrasing your search')) {
                finished = 'Completed';
                callback(userdata.concat(shortnames), finished, count, filename);
                return;
            }

            if (message.body.includes('upgrade to Premium to continue searching')){
                finished = 'Search limit hit';
                callback(userdata.concat(shortnames), finished, count, filename);
                return;
            }

            // Check if url has already been parsed
            if (!urls.includes(message.url) && finished === '') {
                // parse users and store in userdata
                //var people = message.body.split('<span class=\"name actor-name\">');
                var people = message.body.split('"title":{"textDirection":"FIRST_STRONG","text":"');
                for (var i = 1; i < people.length; i++) {
                    //var person = people[i].split('</span')[0];
                    var person = people[i].split('"')[0];
                    var short = false;
                    if(junk || genusers){
                        // try and catch well known accrediations
                        var username = person.toLowerCase();

                        // Replace diacritics with standard characters then remove any none ascii chars - technically not needed for AD but may avoid some problems
                        username = username.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");

                        // clear out any possible dividers
                        username = username.replace('/', ' ');
                        username = username.replace('\\', ' ');

                        // Remove postnominals
                        for(var index in postnominals){
                            //regex failing?
                            //username = username.replace(new RegExp("\\b" + postnominals[index] + "\\b"), " ");

                            username = username.replace(" " + postnominals[index] + " "," ");
                            if(username.endsWith(" " + postnominals[index])) {
                              username = username.substring(0, username.lastIndexOf(" "));
                            }

                        }

                        username = username.trim();

                        var nameparts = username.split(' ');
                        var firstname = nameparts[0];
                        var lastname = nameparts[nameparts.length - 1];

                        // Remove any random bits after curley brackets such as accrediations
                        if(username.includes('(')){
                          username = username.split('(')[0].trim();
                          nameparts = username.split(' ');
                          lastname = nameparts[nameparts.length - 1]
                        }

                        // Remove any random bits after commas such as accrediations
                        if(username.includes(',')){
                          username = username.split(',')[0].trim();
                          nameparts = username.split(' ');
                          lastname = nameparts[nameparts.length - 1];
                        }

                        // Remove any random bits after hyphens such as accrediations
                        if(username.includes('-')){
                          username = username.split('-')[0].trim();
                          nameparts = username.split(' ');
                          lastname = nameparts[nameparts.length - 1];
                        }

                        // Hidden surname (M.) chop off final dot,  need to exclude some some username permitations
                        if(lastname.length == 2 && lastname.charAt(1) == '.'){
                            lastname = lastname.charAt(0);
                            short = true;
                        }

                        // remove any redundant spaces and drop to lowercase.
                        firstname = firstname.trim().toLowerCase();
                        lastname = lastname.trim().toLowerCase();
                        username = username.trim().toLowerCase();
                    }

                    if(genusers){
                        // first                anna
                        var user1 = firstname;
                        // firstlast            annakey
                        var user2 = firstname + lastname;
                        // first.last           anna.key&page=5
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

                        if(short){
                            shortnames = shortnames.concat('"' + person + '",' + firstname + ' ' + lastname + ',' + user1 + ',' + user2 + ',' + user3 + ',' + user4 + ',' + user5 +  ',' + user6 +  ',' + user7  +  ',' + user8  +  ',' + user9  +  ',' + user10 +  ',' + user11  +  ',' + user12  +  ',' + user13   +'\n');
                        }
                        else {
                          userdata = userdata.concat('"' + person + '",' + firstname + ' ' + lastname + ',' + user1 + ',' + user2 + ',' + user3 + ',' + user4 + ',' + user5 +  ',' + user6 +  ',' + user7  +  ',' + user8  +  ',' + user9  +  ',' + user10 +  ',' + user11  +  ',' + user12  +  ',' + user13   +'\n');
                        }
                    }
                    else if (junk) {
                        if(short){
                          shortnames = shortnames.concat(person + ',' + firstname + ' ' + lastname + '\n');
                        }
                        else {
                          userdata = userdata.concat(person + ',' + firstname + ' ' + lastname + '\n');
                        }
                    }
                    else {
                          userdata = userdata.concat(person + '\n');
                    }
                    short = false;
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


                sleep(5000 + (Math.floor(Math.random() * 20000)));
                // Set the tab to the require page, update the tab and execute the injected js
                chrome.tabs.query({active: true,currentWindow: true}, function(tabs) {
                    var tab = tabs[0];
                    chrome.tabs.update(tab.id, {
                        url: href
                    });

                    sleep(5000 + (Math.floor(Math.random() * 20000)));
                    chrome.tabs.executeScript(tab.id, {
                        file: 'content.js'
                    });
                    urls.push(message.url);
                });
            }
        }
        catch(err)
        {
            finished = 'Error';
            console.log(err);
            callback(userdata.concat(shortnames), finished, count, filename);
        }
    });
};

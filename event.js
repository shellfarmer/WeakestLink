// Function to slow down the pace of attack

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function getpn() {
    var url = 'https://raw.githubusercontent.com/shellfarmer/WeakestLink/master/postnominals.txt';
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

function getnicknames() {
    var url = 'https://raw.githubusercontent.com/shellfarmer/WeakestLink/master/nicknames.txt';
    var nicknames = [];
    fetch(url)
        .then((resp) => resp.text())
        .then(function(data) {
            var lines = data.split(/\n/);
            for (var i = 0; i < lines.length; i++) {
                // only push this line if it contains a non whitespace character.
                if (/\S/.test(lines[i])) {
                    parts = lines[i].replace(/\n|\r/g, "").trim().split(":");
                    nicknames[parts[0]] = parts[1];
                }
            }
        });
    return nicknames;
}

var urls = [];
var count = 0;
var finished = '';
var page = '';
var postnominals = []
var filename = '';
var userdata = '';
var shortnames = '';

function completed(data, finished, count, filename, tabid) {
   console.log("Completed: " + finished)
    var blob = new Blob([data], {
        type: "text/csv;charset=utf-8"
    });
    console.log("Data: " + blob)
    chrome.downloads.download({
        'url': URL.createObjectURL(blob),
        'filename': filename
    });

    var message = "";
    var code = "";

    //message = "<html><body><h2><img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true>WeakestLink Dump Finished</h2><p> Finished with final status message of : $$STATUS$$ </p><p> Retrieved details of $$COUNT$$ users </p><p> &quot;$$FILENAME$$&quot; should be in your downloads</p><p>Click <a href=$$URL$$> here</a> to return to the first page</p><body></html>";
    message = "<html><body><style>.body{background-color:#f7f7f7}.flex-container{height:100%;padding:0;margin:0;display:-webkit-box;display:-moz-box;display:-ms-flexbox;display:-webkit-flex;display:flex;align-items:center;justify-content:center;flex-direction:column;margin-top:50px}.row{width:auto;border:1px;border-radius:5px;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);text-align:center}.inner{padding:10px}table{border-collapse:collapse;width:100%}td,th{padding:15px}table,td,th{border:1px solid #ddd;text-align:left}</style><div class=flex-container> <img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true /> <h2> WeakestLink Dump Finished </h2><div class=row><div class=inner><table><tr><td>Final Status</td><td>$$STATUS$$</td> </tr> <tr> <td>Total Users Identified</td><td>$$COUNT$$</td></tr> <tr> <td>File Location</td><td>&quot;$$FILENAME$$&quot;</td></tr></table><p>Click <a href=$$URL$$>here</a> to return to the first search page</p></div></div></div></body></html>";
    message = message.replace('$$STATUS$$', finished);
    message = message.replace('$$COUNT$$', count);
    message = message.replace('$$FILENAME$$', filename);
    message = message.replace('$$URL$$', urls[0].substring(0, urls[0].length - 7));
    code = 'document.body.innerHTML = "' + message + '";';
    chrome.tabs.executeScript(tabid, {
        code: code
    });
    chrome.runtime.reload();
}

// This function is called onload in the popup code
function dumpCurrentPage(url, tabid, junk, genusers, headline, nickname) {
    postnominals = getpn();
    var lastnameprefix = ['o', 'da', 'de', 'di', 'al', 'ul', 'el'];

    // This is sloppy, swap with loading from file and find a decent source of names!  What to do with multiples such as Elizabeth
    if (nickname) {
        var nicknames = getnicknames();
    }

    var headlinetitles = "";
    if (headline) {
        headlinetitles = ",headline,subline";
    }

    var header = 'LinkedIn Name';
    if (junk) {
        header = 'LinkedIn Name' + headlinetitles + ',clean name';
    }
    if (genusers) {
        header = 'LinkedIn Name' + headlinetitles + ',clean name,first,firstlast,first.last,firstl,f.last,flast,lfirst,l.first,lastf,last,last.f,last.first,fl';
    }

    userdata = header + '\n';

    chrome.webNavigation.onCompleted.addListener(function(details) {
          if(details.tabId == tabid && finished === ""){
            sleep(500);
            chrome.tabs.executeScript(tabid, {
                file: 'content.js'
            });
          }
    }, { url:[{hostContains:"linkedin.com"}] });

    chrome.tabs.update(tabid, {
        url: url
    });

    // Listener that recieves messages from injected content.js
    chrome.runtime.onMessage.addListener(function(message) {
        try {
            if (filename == '') {
                filterparts = message.body.split('{"filterValues":[{"displayValue":"');
                filename = filterparts[1].split('"')[0];
                for (var i = 2; i < filterparts.length; i++) {
                    filename = filename + '-' + filterparts[i].split('"')[0];
                }
                filename = filename + '.csv'
            }

            // No more results return data to popup
            if (message.body.includes('Your search returned no results. Try removing filters or rephrasing your search') && finished === "") {
                finished = 'completed';
                completed(userdata.concat(shortnames), finished, count, filename, tabid);
                return;
            }

            // Out of search credits
            if ((message.body.includes('upgrade to Premium to continue searching') || message.body.includes('Search limit reached')) && finished === "") {
                finished = 'search limit hit';
                completed(userdata.concat(shortnames), finished, count, filename, tabid);
                return;
            }

            // Check if url has already been parsed
            if (!urls.includes(message.url) && finished === '') {
                // parse users and store in userdata
                var people = message.body.split('"title":{"textDirection":"FIRST_STRONG","text":"');
                for (var i = 1; i < people.length; i++) {
                    //var person = people[i].split('</span')[0];
                    var person = people[i].split('",')[0];

                    var headlinedata = ""

                    if (headline) {
                        var headlinetext = people[i].split('"headline":{"textDirection":"FIRST_STRONG","text":"')[1].split('",')[0];;
                        var subline = people[i].split('"subline":{"textDirection":"FIRST_STRONG","text":"')[1].split('",')[0];
                        headlinedata = "\"" + headlinetext + "\",\"" + subline + "\",";
                    }

                    person = person.replace('"', '');
                    if (person === "") {
                        continue;
                    }
                    var short = false;
                    if (junk || genusers || nickname) {
                        // try and catch well known accrediations
                        var username = person.toLowerCase();

                        // Replace diacritics with standard characters then remove any none ascii chars - technically not needed for AD but may avoid some problems
                        username = username.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");

                        // clear out any possible dividers
                        username = username.replace('/', ' ');
                        username = username.replace('\\', ' ');
                        username = username.replace(/\(.*\)/gi, ' ')

                        // Remove any random bits after commas such as accrediations
                        if (username.includes(',')) {
                            username = username.split(',')[0].trim();
                        }

                        // Remove any random bits after hyphens such as accrediations
                        if (username.includes(' - ')) {
                            username = username.split(' - ')[0].trim();
                        }

                        // Remove postnominals
                        for (var index in postnominals) {
                            //regex failing?
                            //username = username.replace(new RegExp("\\b" + postnominals[index] + "\\b"), " ");

                            username = username.replace(" " + postnominals[index] + " ", " ");
                            if (username.endsWith(" " + postnominals[index])) {
                                username = username.substring(0, username.lastIndexOf(" "));
                            }
                        }

                        username = username.trim();

                        var nameparts = username.split(' ');
                        var firstname = nameparts[0];
                        var lastname = nameparts[nameparts.length - 1];

                        // Handle lastnames with prefixes such as de or el
                        if (nameparts.length > 2) {
                            var prefix = nameparts[nameparts.length - 2];
                            for (var index in lastnameprefix) {
                                if (prefix.toLowerCase() == lastnameprefix[index]) {
                                    lastname = lastnameprefix[index] + lastname;
                                }
                            }
                        }

                        // Hidden lastname (M.) chop off final dot,  need to exclude some some username permitations
                        if (lastname.length == 2 && lastname.charAt(1) == '.') {
                            lastname = lastname.charAt(0);
                            short = true;
                        }

                        // remove any redundant spaces and drop to lowercase.
                        firstname = firstname.trim().toLowerCase();
                        lastname = lastname.trim().toLowerCase();
                        username = username.trim().toLowerCase();
                    }

                    var firstnames = [firstname];

                    if (nickname) {
                        if (typeof nicknames[firstname] != 'undefined') {
                            firstnames.push(nicknames[firstname]);
                        }
                    }

                    for (var index in firstnames) {
                        firstname = firstnames[index];

                        if (genusers) {
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
                            var user7 = lastname.charAt(0) + firstname;
                            // l.first              k.anna
                            var user8 = lastname.charAt(0) + '.' + firstname;
                            // lastf                keya
                            var user9 = lastname + firstname.charAt(0);
                            // last                 key
                            var user10 = lastname;
                            // last.f               key.a
                            var user11 = lastname + firstname.charAt(0);
                            // last.first           key.anna
                            var user12 = lastname + firstname;
                            // fl                   ak
                            var user13 = firstname.charAt(0) + lastname.charAt(0);

                            if (short) {
                                shortnames = shortnames.concat('"' + person + '",' + headlinedata + firstname + ' ' + lastname + ',' + user1 + ',' + user2 + ',' + user3 + ',' + user4 + ',' + user5 + ',' + user6 + ',' + user7 + ',' + user8 + ',' + user9 + ',' + user10 + ',' + user11 + ',' + user12 + ',' + user13 + '\n');
                            } else {
                                userdata = userdata.concat('"' + person + '",' + headlinedata + firstname + ' ' + lastname + ',' + user1 + ',' + user2 + ',' + user3 + ',' + user4 + ',' + user5 + ',' + user6 + ',' + user7 + ',' + user8 + ',' + user9 + ',' + user10 + ',' + user11 + ',' + user12 + ',' + user13 + '\n');
                            }
                        } else if (junk) {
                            if (short) {
                                shortnames = shortnames.concat(person + ',' + headlinedata + firstname + ',' + lastname + '\n');
                            } else {
                                userdata = userdata.concat(person + ',' + headlinedata + firstname + ',' + lastname + '\n');
                            }
                        } else {
                            userdata = userdata.concat(person + '\n');
                        }
                        short = false;
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

                if (chrome.runtime.lastError) {
                    finished = 'Cancelled';
                    completed(userdata.concat(shortnames), finished, count, filename, tabid);
                } else {
                    chrome.tabs.update(tabid, {
                        url: href
                    });
                    urls.push(message.url);
                }
            }
        } catch (err) {
            finished = 'error - ' + err.message;
            completed(userdata.concat(shortnames), finished, count, filename, tabid);
        }
    });
};

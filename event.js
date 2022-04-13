// Function to slow down the pace of attack

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

function getpn() {
  var url = 'https://raw.githubusercontent.com/shellfarmer/WeakestLink/master/postnominals.txt';
  var pn = [];
  fetch(url)
    .then((resp) => resp.text())
    .then(function (data) {
      var lines = data.split(/\n/);
      for (var i = 0; i < lines.length; i++) {
        // only push this line if it contains a non whitespace character.
        if (/\S/.test(lines[i])) {
          pn.push(lines[i].replace(/\n|\r/g, '').trim());
        }
      }
    });
  return pn;
}

function getHonorifics() {
  var url = 'https://raw.githubusercontent.com/shellfarmer/WeakestLink/master/honorifics.txt';
  var honorifics = [];
  fetch(url)
    .then((resp) => resp.text())
    .then(function (data) {
      var lines = data.split(/\n/);
      for (var i = 0; i < lines.length; i++) {
        // only push this line if it contains a non whitespace character.
        if (/\S/.test(lines[i])) {
          honorifics.push(lines[i].replace(/\n|\r/g, '').trim());
        }
      }
    });
  return honorifics;
}

function getnicknames() {
  var url = 'https://raw.githubusercontent.com/shellfarmer/WeakestLink/master/nicknames.txt';
  var nicknames = [];
  fetch(url)
    .then((resp) => resp.text())
    .then(function (data) {
      var lines = data.split(/\n/);
      for (var i = 0; i < lines.length; i++) {
        // only push this line if it contains a non whitespace character.
        if (/\S/.test(lines[i])) {
          parts = lines[i].replace(/\n|\r/g, '').trim().split(':');
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
var postnominals = [];
var honorifics = [];
var nicknames = [];
var filename = '';
var userdata = '';
var shortnames = '';
var lastnameprefix = ['o', 'da', 'de', 'di', 'al', 'ul', 'el'];
var junk = false;
var headline = false;
var count = 0;
var run = false;
var maxrequests = 0;
var tabid = 0;

function completed(data, finished, count, filename, tabid) {
  var blob = new Blob([data], {
    type: 'text/csv;charset=utf-8',
  });

  var downloadid = 0;

  chrome.downloads.onChanged.addListener(function (delta) {
    if (!delta.state || delta.state.current != 'complete' || delta.id != downloadid) {
      return;
    }

    chrome.downloads.search({ id: downloadid }, function (results) {
      var downloadpath = results[0]['filename'];

      var message = '';
      var code = '';
      var url = '';

      message =
        '<html><body><style>.body{background-color:#f7f7f7}.flex-container{height:100%;padding:0;margin:0;display:-webkit-box;display:-moz-box;display:-ms-flexbox;display:-webkit-flex;display:flex;align-items:center;justify-content:center;flex-direction:column;margin-top:50px}.row{width:auto;border:1px;border-radius:5px;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);text-align:center}.inner{padding:10px}table{border-collapse:collapse;width:100%}td,th{padding:15px}table,td,th{border:1px solid #ddd;text-align:left}</style><div class=flex-container> <img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true /> <h2> WeakestLink Dump Finished </h2><div class=row><div class=inner><table><tr><td>Final Status</td><td>$$STATUS$$</td> </tr> <tr> <td>Total Users Identified</td><td>$$COUNT$$</td></tr><tr><td>Downloaded File</td><td>&quot;$$FILENAME$$&quot;</td></tr></table><p>Click <a href=$$URL$$>here</a> to return to the first search page</p></div></div></div></body></html>';
      message = message.replace('$$STATUS$$', finished);
      message = message.replace('$$COUNT$$', count);
      message = message.replace('$$FILENAME$$', downloadpath);
      message = message.replace('$$URL$$', url);
      code = 'document.body.innerHTML = "' + message + '";';
      chrome.tabs.executeScript(tabid, {
        code: code,
      });
      chrome.runtime.reload();
    });
  });

  chrome.downloads.download(
    {
      url: URL.createObjectURL(blob),
      filename: filename,
    },
    function (id) {
      downloadid = id;
    }
  );
}

function addPerson(personarray) {
  person = personarray[0];
  person = person.replace('"', '');
  if (person === '') {
    return;
  }

  if (person.includes('LinkedIn')) {
    return;
  }

  var short = false;
  if (junk || genusers || nickname) {
    // try and catch well known accrediations
    var username = person.toLowerCase();

    // Replace diacritics with standard characters then remove any none ascii chars - technically not needed for AD but may avoid some problems
    username = username
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '');

    // clear out any possible dividers
    username = username.replace(/\//g, ' ');
    username = username.replace(/\\/g, ' ');
    username = username.replace(/\"/g, ' ');
    username = username.replace(/\(.*\)/gi, ' ');
    username = username.replace(/\[.*\]/gi, ' ');

    // Remove any random bits after commas such as accrediations
    if (username.includes(',')) {
      username = username.split(',')[0].trim();
    }

    // Remove any random bits after hyphens such as accrediations
    if (username.includes(' - ')) {
      username = username.split(' - ')[0].trim();
    }

    // Remove postnominals - Switch this to regex
    for (var index in postnominals) {
      //regex failing?
      //username = username.replace(new RegExp("\\b" + postnominals[index] + "\\b"), " ");

      username = username.replace(' ' + postnominals[index] + ' ', ' ');
      if (username.toUpperCase().endsWith(' ' + postnominals[index].toUpperCase())) {
        username = username.substring(0, username.lastIndexOf(' '));
      }
    }

    // Remove honorifics - Switch this to regex
    for (var index in honorifics) {

      if (username.toUpperCase().startsWith(honorifics[index].toUpperCase() + ' ') || username.toUpperCase().startsWith(honorifics[index].toUpperCase() + '. ')) {
        username = username.substring(username.indexOf(' '));
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

  var headlinedata = "";

  if (nickname) {
    if (typeof nicknames[firstname] != 'undefined') {
      firstnames.push(nicknames[firstname]);
    }
  }

  if (headline) {
    headlinedata = '"' + personarray[1] + '","' + personarray[2] + '","'+ personarray[3] + '",';
  }

  for (var index in firstnames) {
    firstname = firstnames[index];

    if (genusers) {
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

      var personline = '"' +  person + '",' + headlinedata + firstname +  ' ' +  lastname +  ',' +  user1 +  ',' +  user2 +  ',' +  user3 +  ',' +  user4 +  ',' +  user5 +  ',' +  user6 +  ',' +  user7 +  ',' +  user8 +  ',' +  user9 +  ',' +  user10 +  ',' +  user11 +  ',' +  user12 +  ',' +  user13 +  '\n';

      if (short) {
        shortnames = shortnames.concat(personline);
      } else {
        userdata = userdata.concat(personline);
      }
    } else if (junk) {
      if (short) {
        shortnames = shortnames.concat('"' + person + '",' + headlinedata + firstname + ' ' + lastname + '\n');
      } else {
        userdata = userdata.concat('"' + person + '",' + headlinedata + firstname + ' ' + lastname + '\n');
      }
    } else {
      userdata = userdata.concat('"' + person + '"\n');
    }
    short = false;
  }
  count++;
}

// This function is called onload in the popup code
function dumpCurrentPage(url, intabid, junkoption, genusersoption, headlinoption, nicknameoption) {
  if (run) return;

  postnominals = getpn();
  honorifics = getHonorifics();
  junk = junkoption;
  headline = headlinoption;
  genusers = genusersoption;
  nickname = nicknameoption;
  tabid = intabid;

  chrome.tabs.onRemoved.addListener(function (tabid, removed) {
    chrome.runtime.reload();
  });

  // This is sloppy, swap with loading from file and find a decent source of names!  What to do with multiples such as Elizabeth
  if (nickname) {
    nicknames = getnicknames();
  }

  var headlinetitles = '';
  if (headline) {
    headlinetitles = ',headline,subline,handle';
  }

  var header = 'LinkedIn Name';
  if (junk) {
    header = 'LinkedIn Name' + headlinetitles + ',clean name';
  }
  if (genusers) {
    header = 'LinkedIn Name' + headlinetitles + ',clean name,first,firstlast,first.last,firstl,f.last,flast,lfirst,l.first,lastf,last,last.f,last.first,fl';
  }

  userdata = header + '\n';

  chrome.webNavigation.onCompleted.addListener(
    function (details) {
      if (details.tabId == tabid && finished === '') {
        sleep(250);
        chrome.tabs.executeScript(tabid, {
          file: 'content.js',
        });
      }
    },
    { url: [{ hostContains: 'linkedin.com' }] }
  );

  chrome.tabs.update(tabid, {
    url: url,
  });

  var today = new Date();
  filename = 'WeakestLinkDump-' + today.toISOString().replace(/:/g, '-') + '.csv';

  var worker = new Worker('eventWorker.js');

  worker.addEventListener(
    'message',
    function (e) {
      e = e.data;

      if (e.type == 'persondata') {
        for (i = 0; i < e.users.length; i++) {
          addPerson(e.users[i]);
        }

        finished = 'Completed';
        completed(userdata.concat(shortnames), finished, count, filename, tabid);
      } else if (e.type == 'status'){
        message =
          '<html><body><style>.body{background-color:#f7f7f7}.flex-container{height:100%;padding:0;margin:0;display:-webkit-box;display:-moz-box;display:-ms-flexbox;display:-webkit-flex;display:flex;align-items:center;justify-content:center;flex-direction:column;margin-top:50px}.row{width:auto;border:1px;border-radius:5px;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);text-align:center}.inner{padding:10px}table{border-collapse:collapse;width:100%}td,th{padding:15px}table,td,th{border:1px solid #ddd;text-align:left}</style><div class=flex-container> <img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true /> <h2> WeakestLink Dump Running </h2><div class=row><div class=inner><table> <td>Retrieved $$PAGE$$ of $$COUNT$$ page results</td></table><p>Close this tab to stop dumping</p></div></div></div></body></html>';
        message = message.replace('$$PAGE$$', e.page);
        message = message.replace('$$COUNT$$', e.totalResultCount);

        code = 'document.body.innerHTML = "' + message + '";';
        chrome.tabs.executeScript(e.tabid, {
          code: code,
        });
      }
      else {
        finished = "Data Collection Error: " + e.message;
        completed(userdata.concat(shortnames), finished, count, filename, tabid);
      }
    },
    false
  );

  // Listener that recieves messages from injected content.js
  chrome.runtime.onMessage.addListener(function (message) {
    try {
      if (run) return;

      var cookie = '';

      // No more results return data to popup
      if (message.body.includes('Your search returned no results. Try removing filters or rephrasing your search') && finished === '') {
        finished = 'Completed';
        completed(userdata.concat(shortnames), finished, count, filename, tabid);
        return;
      }

      // Out of search credits
      if (
        (message.body.includes('upgrade to Premium to continue searching') ||
          message.body.includes('Search limit reached') ||
          message.body.includes('You’ve reached the monthly limit for profile searches')) &&
        finished === ''
      ) {
        finished = 'search limit hit';
        completed(userdata.concat(shortnames), finished, count, filename, tabid);
        return;
      }

      chrome.cookies.get({ url: 'https://www.linkedin.com', name: 'JSESSIONID' }, function (cookie) {
        worker.postMessage({
          csrftoken: cookie.value.replace(/['"]+/g, ''),
          url: message.url,
        });
      });

      run = true;
    } catch (err) {
      console.log(err.message);
      finished = 'Error - ' + err.message;
      completed(userdata.concat(shortnames), finished, count, filename, tabid);
    }
  });
}

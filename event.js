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
var genusers = false;
var nickname = false;
var count = 0;
var run = false;
var maxrequests = 0;
var tabid = 0;
var users = [];
var totalResultCount = 0;
var workerStatus = 0;

// Worker functions integrated into service worker
function userParse(jd) {
  console.log(jd.elements.length);
  for (var e = 0; e < jd.elements.length; e++) {
    if (jd.elements[e].hasOwnProperty('items')) {
      for (var x = 0; x < jd.elements[e].items.length; x++) {
        var name = '';
        var headline = '';
        var subline = '';
        var handle = '';

        if (!jd.elements[e].items[x].itemUnion.hasOwnProperty('entityResult')) {
          continue;
        }

        if (!jd.elements[e].items[x].itemUnion.entityResult.hasOwnProperty('title')) {
          continue;
        }

        if (jd.elements[e].items[x].itemUnion.entityResult.title.hasOwnProperty('text')) {
          name = jd.elements[e].items[x].itemUnion.entityResult.title.text;
        }

        if (name.includes('LinkedIn')) {
          continue;
        }

        if (jd.elements[e].items[x].itemUnion.entityResult.hasOwnProperty('primarySubtitle') && jd.elements[e].items[x].itemUnion.entityResult.primarySubtitle.hasOwnProperty('text')) {
          headline = jd.elements[e].items[x].itemUnion.entityResult.primarySubtitle.text;
        }

        if (jd.elements[e].items[x].itemUnion.entityResult.hasOwnProperty('secondarySubtitle') && jd.elements[e].items[x].itemUnion.entityResult.secondarySubtitle.hasOwnProperty('text')) {
          subline = jd.elements[e].items[x].itemUnion.entityResult.secondarySubtitle.text;
        }

        var url = jd.elements[e].items[x].itemUnion.entityResult.navigationUrl.split('/');
        handle = url[url.length - 1].split('?')[0];

        users.push(new Array(name, headline, subline, handle));
      }
    }
  }
}

async function processLinkedInData(url, csrftoken) {
  users = [];
  totalResultCount = 0;

  var urlparts;
  try {
    urlparts = decodeURI(url).split('?')[1].split('&');
  } catch (err) {
    throw new Error('Unable to parse URL, check you are on a search results page');
  }

  var queryParameters = '';
  var currentCompany = '';
  var geoUrn = '';
  var profileLanguage = '';
  var serviceCategory = '';
  var title = '';
  var industry = '';

  for (var i = 0; i < urlparts.length; i++) {
    if (urlparts[i].includes('currentCompany')) {
      currentCompany = urlparts[i].split('=')[1];
      currentCompany = currentCompany.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'currentCompany:List(' + currentCompany + '),';
    }

    if (urlparts[i].includes('geoUrn')) {
      geoUrn = urlparts[i].split('=')[1];
      geoUrn = geoUrn.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'geoUrn:List(' + geoUrn + '),';
    }

    if (urlparts[i].includes('profileLanguage')) {
      profileLanguage = urlparts[i].split('=')[1];
      profileLanguage = profileLanguage.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'profileLanguage:List(' + profileLanguage + '),';
    }

    if (urlparts[i].includes('serviceCategory')) {
      serviceCategory = urlparts[i].split('=')[1];
      serviceCategory = serviceCategory.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'serviceCategory:List(' + serviceCategory + '),';
    }

    if (urlparts[i].includes('industry')) {
      industry = urlparts[i].split('=')[1];
      industry = industry.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'industry:List(' + industry + '),';
    }

    if (urlparts[i].includes('title')) {
      title = urlparts[i].split('=')[1];
      title = title.replace(/%2C/g, ',').replace('[', '').replace(']', '').replace(/"/g, '');
      queryParameters += 'title:List(' + title + '),';
    }
  }

  queryParameters += 'resultType:List(PEOPLE)';

  var page = 0;
  var timeout = 500;

  while (page < totalResultCount || totalResultCount === 0) {
    await new Promise(resolve => setTimeout(resolve, timeout));

    var apiUrl =
      'https://www.linkedin.com/voyager/api/search/dash/clusters?decorationId=com.linkedin.voyager.dash.deco.search.SearchClusterCollection-92&origin=FACETED_SEARCH&q=all&query=(flagshipSearchIntent:SEARCH_SRP,queryParameters:(' +
      queryParameters +
      '),includeFiltersInResponse:false)&count=40&start=' + page * 40;

    try {
      var response = await fetch(apiUrl, {
        headers: {
          'csrf-token': csrftoken,
          'x-restli-protocol-version': '2.0.0'
        },
        credentials: 'include'
      });

      if (response.status === 200) {
        var responseText = await response.text();

        if (responseText.includes("You've reached the monthly limit for profile searches.")) {
          throw new Error('Search limit reached');
        }

        var jd = JSON.parse(responseText);

        if (jd.metadata.totalResultCount == 0) {
          throw new Error('No results found');
        }

        if (totalResultCount == 0) {
          totalResultCount = Math.ceil(jd.metadata.totalResultCount / 40);
        }
        if (totalResultCount > 25) {
          totalResultCount = 25;
        }

        userParse(jd);

        // Update status
        var message =
          '<html><body><style>.body{background-color:#f7f7f7}.flex-container{height:100%;padding:0;margin:0;display:-webkit-box;display:-moz-box;display:-ms-flexbox;display:-webkit-flex;display:flex;align-items:center;justify-content:center;flex-direction:column;margin-top:50px}.row{width:auto;border:1px;border-radius:5px;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);text-align:center}.inner{padding:10px}table{border-collapse:collapse;width:100%}td,th{padding:15px}table,td,th{border:1px solid #ddd;text-align:left}</style><div class=flex-container> <img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true /> <h2> WeakestLink Dump Running </h2><div class=row><div class=inner><table> <td>Retrieved $$PAGE$$ of $$COUNT$$ page results</td></table><p>Close this tab to stop dumping</p></div></div></div></body></html>';
        message = message.replace('$$PAGE$$', page + 1);
        message = message.replace('$$COUNT$$', totalResultCount);

        chrome.scripting.executeScript({
          target: { tabId: tabid },
          func: function(htmlContent) {
            document.body.innerHTML = htmlContent;
          },
          args: [message]
        });

        page++;
      } else {
        throw new Error('HTTP ' + response.status);
      }
    } catch (err) {
      throw err;
    }
  }

  return users;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener(function(request) {
  if (request.action === 'dumpCurrentPage') {
    dumpCurrentPage(request.url, request.tabid, request.junk, request.genusers, request.headline, request.nickname);
  }
});

function completed(data, finished, count, filename, tabid) {
  // Convert data to base64 data URL for MV3 compatibility
  var dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data);

  var downloadid = 0;

  chrome.downloads.onChanged.addListener(function (delta) {
    if (!delta.state || delta.state.current != 'complete' || delta.id != downloadid) {
      return;
    }

    chrome.downloads.search({ id: downloadid }, function (results) {
      var downloadpath = results[0]['filename'];

      var message = '';
      var url = '';

      message =
        '<html><body><style>.body{background-color:#f7f7f7}.flex-container{height:100%;padding:0;margin:0;display:-webkit-box;display:-moz-box;display:-ms-flexbox;display:-webkit-flex;display:flex;align-items:center;justify-content:center;flex-direction:column;margin-top:50px}.row{width:auto;border:1px;border-radius:5px;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);text-align:center}.inner{padding:10px}table{border-collapse:collapse;width:100%}td,th{padding:15px}table,td,th{border:1px solid #ddd;text-align:left}</style><div class=flex-container> <img src=https://github.com/shellfarmer/WeakestLink/blob/master/images/logo128.png?raw=true /> <h2> WeakestLink Dump Finished </h2><div class=row><div class=inner><table><tr><td>Final Status</td><td>$$STATUS$$</td> </tr> <tr> <td>Total Users Identified</td><td>$$COUNT$$</td></tr><tr><td>Downloaded File</td><td>&quot;$$FILENAME$$&quot;</td></tr></table><p>Click <a href=$$URL$$>here</a> to return to the first search page</p></div></div></div></body></html>';
      message = message.replace('$$STATUS$$', finished);
      message = message.replace('$$COUNT$$', count);
      message = message.replace('$$FILENAME$$', downloadpath);
      message = message.replace('$$URL$$', url);
      chrome.scripting.executeScript({
        target: { tabId: tabid },
        func: function(htmlContent) {
          document.body.innerHTML = htmlContent;
        },
        args: [message]
      });
      //chrome.runtime.reload();
    });
  });

  chrome.downloads.download(
    {
      url: dataUrl,
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
      var user11 = lastname + '.' + firstname.charAt(0);
      // last.first           key.anna
      var user12 = lastname + '.' + firstname;
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
      if(headline)
        userdata =  userdata.concat('"' + person + '",' + headlinedata + '\n');
      else
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

  chrome.tabs.onRemoved.addListener(function () {
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


  var header = 'LinkedIn Name' + headlinetitles;
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
        chrome.scripting.executeScript({
          target: { tabId: tabid },
          files: ['content.js']
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

  // Listener that recieves messages from injected content.js
  chrome.runtime.onMessage.addListener(function (message) {
    try {
      if (run) return;

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

      chrome.cookies.get({ url: 'https://www.linkedin.com', name: 'JSESSIONID' }, async function (cookie) {
        try {
          var csrftoken = cookie.value.replace(/['"]+/g, '');
          var users = await processLinkedInData(message.url, csrftoken);

          // Process all users
          for (var i = 0; i < users.length; i++) {
            addPerson(users[i]);
          }

          finished = 'Completed';
          completed(userdata.concat(shortnames), finished, count, filename, tabid);
        } catch (error) {
          finished = 'Data Collection Error: ' + error.message;
          completed(userdata.concat(shortnames), finished, count, filename, tabid);
        }
      });

      run = true;
    } catch (err) {
      console.log(err.message);
      finished = 'Error - ' + err.message;
      completed(userdata.concat(shortnames), finished, count, filename, tabid);
    }
  });
}

var users = [];
var totalResultCount = 0;
var status = 0;

// Function to slow down the pace of attack
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

function userParse(jd) {
  for (e = 0; e < jd.elements.length; e++) {
    if (jd.elements[e].hasOwnProperty('results')) {
      for (x = 0; x < jd.elements[e].results.length; x++) {
        var name = '';
        var headline = '';
        var subline = '';
        var handle = '';

        if (jd.elements[e].results[x].title.hasOwnProperty('text')) {
          name = jd.elements[e].results[x].title.text;
        }

        if (name.includes('LinkedIn')) {
          continue;
        }

        if (jd.elements[e].results[x].hasOwnProperty('primarySubtitle') && jd.elements[e].results[x].primarySubtitle.hasOwnProperty('text')) {
          headline = jd.elements[e].results[x].primarySubtitle.text;
        }

        if (jd.elements[e].results[x].hasOwnProperty('secondarySubtitle') && jd.elements[e].results[x].secondarySubtitle.hasOwnProperty('text')) {
          subline = jd.elements[e].results[x].secondarySubtitle.text;
        }

        var url = jd.elements[e].results[x].navigationUrl.split('/');

        handle = url[url.length-1].split('?')[0];

        users.push(new Array(name, headline, subline, handle));
      }
    }
  }
}

function getData(i, queryParameters, csrftoken, timeout)
{
  sleep(timeout);
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  var url =
    'https://www.linkedin.com/voyager/api/search/dash/clusters?decorationId=com.linkedin.voyager.dash.deco.search.SearchClusterCollection-92&origin=FACETED_SEARCH&q=all&query=(flagshipSearchIntent:SEARCH_SRP,queryParameters:(' +
    queryParameters +
    '),includeFiltersInResponse:false)&count=40&start=' +i * 40;

  xhr.open('GET', url, false);
  xhr.setRequestHeader('csrf-token', csrftoken);
  xhr.setRequestHeader('x-restli-protocol-version', '2.0.0');
  xhr.send();

  if (xhr.status == 200) {

    if(xhr.responseText.includes('You’ve reached the monthly limit for profile searches.')){
      self.postMessage({ type: 'error', message: "Search limit reached" });
      return;
    }

    var jd = JSON.parse(xhr.responseText);

    if(jd.metadata.totalResultCount == 0){
      self.postMessage({ type: 'error', message: "No results found" });
      return;
    }

    if (totalResultCount == 0) {
      totalResultCount = Math.ceil(jd.metadata.totalResultCount / 40);
    }
    if (totalResultCount > 25) {
      totalResultCount = 25;
    }
    userParse(jd);
  }
  status = xhr.status;
}

self.addEventListener(
  'message',
  function (e) {
    var data = e.data;

    var currentCompany = '';
    var geoUrn = '';
    var profileLanguage = '';
    var serviceCategory = '';
    var title = '';
    var industry = '';


    try {
      urlparts = decodeURI(data.url).split('?')[1].split('&');
    } catch (err) {
      self.postMessage({ type: 'error', message: 'Unable to parse URL, check you are on a search results page' });
    }


    queryParameters = '';

    // Tidy up parts of url,  bit sloppy but works?
    for (i = 0; i < urlparts.length; i++) {
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

      // industry=["96"]
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

    var i = 0;
    var timeout = 500;
    do {
      //(function (i) {

       setTimeout(getData(i, queryParameters, data.csrftoken, timeout), timeout);

        if (status == 200){
        }
        else {
          // handle errors better?
          self.postMessage({ type: 'error', message: xhr.status });
          console.log(xhr.status);
        }
      //})(i);
      i++;
      self.postMessage({
        type: 'status',
        page: i,
        totalResultCount: totalResultCount,
      });
    } while (i < totalResultCount);

    self.postMessage({ type: 'persondata', users: users });
  },
  false
);

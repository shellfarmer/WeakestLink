window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');
    let savebutton = document.getElementById('saveoptions');
    var tabid;


   chrome.storage.sync.get({'options':{'junk':true,'genusers':true,'headline':false,'nickname':false}}, function(result) {
   document.getElementById('junk').checked  = result.options['junk'];
   document.getElementById('genusers').checked  = result.options['genusers'];
   document.getElementById('headline').checked  = result.options['headline'];
   document.getElementById('nickname').checked  = result.options['nickname'];
 });

    savebutton.onclick = function(element) {

      var junk = document.getElementById('junk').checked;
      var genusers = document.getElementById('genusers').checked;
      var headline = document.getElementById('headline').checked;
      var nickname = document.getElementById('nickname').checked;

      var checks = {
          'junk':junk,
          'genusers':genusers,
          'headline':headline,
          'nickname':nickname,
      };
      chrome.storage.sync.set({'options':checks}, function() {
          alert('Options saved');
       });

    };

    runbutton.onclick = function(element) {
        document.getElementById('dumpusers').disabled = true;

        var junk = document.getElementById('junk').checked;
        var genusers = document.getElementById('genusers').checked;
        var headline = document.getElementById('headline').checked;
        var nickname = document.getElementById('nickname').checked;

        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            var tab = tabs[0];
            var url = tab.url + '&page=1';
            tabid = tab.id;

            chrome.runtime.getBackgroundPage(function(eventPage) {
                eventPage.dumpCurrentPage(url, tabid, junk, genusers, headline, nickname)
            });
            window.close();
        });

    };
});

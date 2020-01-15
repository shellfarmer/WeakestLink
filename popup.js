window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');
    var tabid;
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

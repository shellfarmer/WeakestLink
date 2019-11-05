window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');
    var tabid;

    runbutton.onclick = function(element) {
        document.getElementById('dumpusers').disabled = true;

        var junk = document.getElementById('junk').checked;
        var genusers = document.getElementById('genusers').checked;

        chrome.tabs.query({active: true,currentWindow: true}, function(tabs) {
            var tab = tabs[0];
            var temp = tab.url + '&page=1';
            tabid = tab.id;
            chrome.tabs.update(tab.id, {
                url: temp
            });
        });
        chrome.runtime.getBackgroundPage(function(eventPage) {
            eventPage.dumpCurrentPage(tabid, junk, genusers)
        });

        setTimeout(function(){ window.close(); }, 3000);
    };
});

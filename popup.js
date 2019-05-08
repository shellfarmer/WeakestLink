function endDump(message, finished, count, filename) {
    var link = document.createElement('a');
    link.textContent = 'Save as CSV';
    link.download = filename + '.csv';
    link.href = 'data:text/csv,' + message;
    document.body.appendChild(link);
    document.getElementById('dumpusers').disabled = false;
    link.click();
    if(!alert('Dump finished as ' + finished + ' with ' + count + ' users')){
      chrome.runtime.reload();
    }

}

window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');
    let cancelbutton = document.getElementById('canceldump');

    runbutton.onclick = function(element) {
        document.getElementById('dumpusers').disabled = true;
        document.getElementById('canceldump').disabled = false;

        var junk = document.getElementById('junk').checked;
        var genusers = document.getElementById('genusers').checked;

        chrome.tabs.query({active: true,currentWindow: true}, function(tabs) {
            var tab = tabs[0];
            var temp = tab.url + '&page=1';
            chrome.tabs.update(tab.id, {
                url: temp
            });
        });

        chrome.runtime.getBackgroundPage(function(eventPage) {
            eventPage.dumpCurrentPage(endDump, junk, genusers)
        });

    };

    cancelbutton.onclick = function(element) {
      chrome.runtime.getBackgroundPage(function(eventPage) {
          eventPage.cancelDump(endDump)
        });
    };
});

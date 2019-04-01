function endDump(message, finished, count) {
    var link = document.createElement("a");
    link.textContent = "Save as CSV";
    link.download = "LinkedIn Users.csv";
    link.href = "data:text/csv," + message;
    document.body.appendChild(link);
    document.getElementById('dumpusers').disabled = false;

    alert('Dump finishded as ' + finished + ' with ' + count + ' users');
}

window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');
    let cancelbutton = document.getElementById('canceldump');

    runbutton.onclick = function(element) {
        document.getElementById('dumpusers').disabled = true;
        document.getElementById('canceldump').disabled = false;

        var junk = document.getElementById('junk').checked;
        var genusers = document.getElementById('genusers').checked;

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

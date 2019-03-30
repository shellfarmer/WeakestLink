
function endDump(message) {
    var link = document.createElement("a");
    link.textContent = "Save as CSV";
    link.download = "file.csv";
    link.href = "data:text/csv," + message;
    document.body.appendChild(link);
    document.getElementById('dumpusers').disabled = false;
}

window.addEventListener('load', function(evt) {
    let runbutton = document.getElementById('dumpusers');

    runbutton.onclick = function(element) {
        document.getElementById('dumpusers').disabled = true;
        chrome.runtime.getBackgroundPage(function(eventPage) {
            eventPage.dumpCurrentPage(endDump)
        });
    };
});

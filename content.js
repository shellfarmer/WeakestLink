chrome.runtime.sendMessage({
    'title': document.title,
    'url': window.location.href,
    'summary': window.document.body.innerHTML
});

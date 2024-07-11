let toggleSwitch = document.getElementById("extension-toggle");

// Load the saved state
chrome.storage.sync.get(["extensionEnabled"], function (result) {
  if (result.extensionEnabled) {
    toggleSwitch.checked = true;
  }
});

toggleSwitch.addEventListener("change", function () {
  if (toggleSwitch.checked) {
    chrome.storage.sync.set({ extensionEnabled: true });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: startSkipIntro,
      });
    });
  } else {
    chrome.storage.sync.set({ extensionEnabled: false });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: stopSkipIntro,
      });
    });
  }
});

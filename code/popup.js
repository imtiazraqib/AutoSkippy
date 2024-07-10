let toggleSwitch = document.getElementById("extension-toggle"),
  onIndicator = document.getElementById("onIndicator"),
  offIndicator = document.getElementById("offIndicator");

// Load the saved state
chrome.storage.sync.get(["extensionEnabled"], function (result) {
  if (result.extensionEnabled) {
    toggleSwitch.checked = true;
    onIndicator.classList.remove("hide");
    offIndicator.classList.add("hide");
  }
});

toggleSwitch.addEventListener("change", function () {
  if (toggleSwitch.checked) {
    onIndicator.classList.remove("hide");
    offIndicator.classList.add("hide");
    chrome.storage.sync.set({ extensionEnabled: true });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: startSkipIntro,
      });
    });
  } else {
    offIndicator.classList.remove("hide");
    onIndicator.classList.add("hide");
    chrome.storage.sync.set({ extensionEnabled: false });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: stopSkipIntro,
      });
    });
  }
});

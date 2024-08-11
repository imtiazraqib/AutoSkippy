let toggleSwitch = document.getElementById("extension-toggle");

// Load the saved state
chrome.storage.sync.get(["extensionEnabled"], function (result) {
  if (result.extensionEnabled) {
    toggleSwitch.checked = true;
  }
});

// Function to set the UI based on the detected platform
function setPlatformUI(platform) {
  const platformIcon = document.getElementById("platform-icon");
  const platformText = document.getElementById("platform-text");
  const platformBadge = document.getElementById("platform-badge");

  switch (platform) {
    case "netflix":
      platformBadge.classList.add("hide");
      platformIcon.src = "icons8-netflix-96.png";
      platformText.innerText = "Skip Intro, Recap & Next Episode";
      break;
    case "youtube":
      platformBadge.classList.add("hide");
      platformIcon.src = "icons8-youtube-96.png";
      platformText.innerText = "Skip Ads";
      break;
    case "prime":
      platformBadge.classList.add("hide");
      platformIcon.src = "icons8-amazon-prime-video-96.png";
      platformText.innerText = "Skip Intro & Recap";
      break;
    case "crave":
      platformBadge.classList.add("hide");
      platformIcon.src = "icons8-crave-96.png";
      platformText.innerText = "Skip Intro & Next Episode";
      break;
    case "disney":
      platformBadge.classList.remove("hide");
      platformIcon.src = "icons8-disney-plus-96.png";
      platformText.innerText = "Skip Intro & Next Episode";
    default:
      platformBadge.classList.add("hide");
      platformIcon.src = "icons8-no-96.png";
      platformText.innerText = "No supported platform detected";
  }
}

// Get the active tab's URL and set the platform UI
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  let url = tabs[0].url;
  if (url.includes("netflix.com")) {
    setPlatformUI("netflix");
  } else if (url.includes("youtube.com")) {
    setPlatformUI("youtube");
  } else if (url.includes("primevideo.com")) {
    setPlatformUI("prime");
  } else if (url.includes("crave.ca")) {
    setPlatformUI("crave");
  } else if (url.includes("disneyplus.com")) {
    setPlatformUI("disney");
  } else {
    setPlatformUI("default");
  }
});

toggleSwitch.addEventListener("change", function () {
  if (toggleSwitch.checked) {
    chrome.storage.sync.set({ extensionEnabled: true });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["script.js"], // Ensure the script is loaded
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

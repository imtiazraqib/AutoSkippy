const skipIntroToggle = document.getElementById("skip-intro-toggle");
const skipAdsToggle = document.getElementById("skip-ads-toggle");
const skipRecapToggle = document.getElementById("skip-recap-toggle");
const autoNextToggle = document.getElementById("auto-next-toggle");

chrome.storage.sync
  .get(["skipIntro", "skipRecap", "autoNext", "skipAds", "extensionEnabled"])
  .then(function(result) {
    // Check for legacy setting and migrate
    if (result.extensionEnabled !== undefined && result.extensionEnabled) {
      skipIntroToggle.checked = true;
      skipAdsToggle.checked = true;
      skipRecapToggle.checked = true;
      autoNextToggle.checked = true;

      chrome.storage.sync.set({
        skipIntro: true,
        skipRecap: true,
        skipAds: true,
        autoNext: true
      });

      chrome.storage.sync.remove("extensionEnabled");
    } else {
      skipIntroToggle.checked = result.skipIntro ?? false;
      skipAdsToggle.checked = result.skipAds ?? false;
      skipRecapToggle.checked = result.skipRecap ?? false;
      autoNextToggle.checked = result.autoNext ?? false;
    }
  }).catch((error) => {
    console.error("Error retrieving extension states:", error);
  });

// Function to set the UI based on the detected platform
function setPlatformUI(platform) {
  const platformIcon = document.getElementById("platform-icon");
  const platformText = document.getElementById("platform-text");
  const platformBadge = document.getElementById("platform-badge");
  
  skipRecapToggle.parentElement.parentElement.style.display = "none";
  skipIntroToggle.parentElement.parentElement.style.display = "none";
  skipAdsToggle.parentElement.parentElement.style.display = "none";
  autoNextToggle.parentElement.parentElement.style.display = "none";

  switch (platform) {
    case "netflix":
      platformIcon.src = "icons8-netflix-96.png";
      platformText.innerText = "Netflix Controls";
      skipIntroToggle.parentElement.parentElement.style.display = "flex";
      skipRecapToggle.parentElement.parentElement.style.display = "flex";
      autoNextToggle.parentElement.parentElement.style.display = "flex";
      break;
    case "youtube":
      platformIcon.src = "icons8-youtube-96.png";
      platformText.innerText = "YouTube Controls";
      skipAdsToggle.parentElement.parentElement.style.display = "flex";
      break;
    case "prime":
      platformIcon.src = "icons8-amazon-prime-video-96.png";
      platformText.innerText = "Prime Video Controls";
      skipIntroToggle.parentElement.parentElement.style.display = "flex";
      skipRecapToggle.parentElement.parentElement.style.display = "flex";
      break;
    case "crave":
      platformIcon.src = "icons8-crave-96.png";
      platformText.innerText = "Crave Controls";
      skipIntroToggle.parentElement.parentElement.style.display = "flex";
      autoNextToggle.parentElement.parentElement.style.display = "flex";
      break;
    case "disney":
      platformBadge.classList.remove("hide");
      platformIcon.src = "icons8-disney-plus-96.png";
      platformText.innerText = "Disney+ Controls";
      skipIntroToggle.parentElement.parentElement.style.display = "flex";
      autoNextToggle.parentElement.parentElement.style.display = "flex";
      break;
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

// Add event listeners for all toggles
function setupToggleListener(toggle, storageKey) {
  toggle.addEventListener("change", function() {
    const updates = {};
    updates[storageKey] = toggle.checked;
    
    chrome.storage.sync.set(updates);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (toggle.checked) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["script.js"]
        });
      } else {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            if (window.skipFeatureInterval) {
              clearInterval(window.skipFeatureInterval);
              window.skipFeatureInterval = null;
            }
          }
        });
      }
    });
  });
}

setupToggleListener(skipIntroToggle, "skipIntro");
setupToggleListener(skipAdsToggle, "skipAds");
setupToggleListener(skipRecapToggle, "skipRecap");
setupToggleListener(autoNextToggle, "autoNext");

window.adMuteState = window.adMuteState || { mutedVideos: new Set() };

(function cleanup() {
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
})();

// Mark clicked elements on the DOM so a lingering button is never clicked
// twice in a row, even if the script is re-injected into the same page.
// The mark clears after 15s so a reused DOM node can still be clicked later.
function clickOnce(element) {
  if (!element || element.dataset.autoskippyClicked === "1") return;
  element.dataset.autoskippyClicked = "1";
  setTimeout(() => delete element.dataset.autoskippyClicked, 15000);
  element.click();
}

function clickFirstMatching(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      clickOnce(element);
      return;
    }
  }
}

// Single storage handler for both initial load and changes
function handleStorageUpdate(result) {
  if (Object.values(result).some((val) => val)) {
    startSkipFeatures(result);
  } else {
    stopSkipFeatures();
  }
}

// Initial load
chrome.storage.sync
  .get(["skipIntro", "skipRecap", "autoNext", "skipAds", "muteNetflixAds"])
  .then(handleStorageUpdate)
  .catch((error) => console.error("Error loading preferences:", error));

// Listen for changes, guarding against listeners stacking on re-injection
if (!window.autoSkippyListenerAdded) {
  window.autoSkippyListenerAdded = true;
  chrome.storage.onChanged.addListener(() => {
    chrome.storage.sync
      .get(["skipIntro", "skipRecap", "autoNext", "skipAds", "muteNetflixAds"])
      .then(handleStorageUpdate)
      .catch((error) => console.error("Error updating preferences:", error));
  });
}

function startSkipFeatures(preferences) {
  clearInterval(window.skipFeatureInterval);
  if (!preferences.muteNetflixAds) restoreNetflixAdMute();

  console.log("Starting skip features with preferences:", preferences);
  window.skipFeatureInterval = setInterval(() => {
    const currentUrl = window.location.href;

    if (currentUrl.includes("netflix.com")) {
      handleNetflix(preferences);
    } else if (currentUrl.includes("youtube.com")) {
      handleYoutube(preferences);
    } else if (currentUrl.includes("primevideo.com") || currentUrl.includes("amazon.")) {
      handlePrime(preferences);
    } else if (currentUrl.includes("crave.ca")) {
      handleCrave(preferences);
    } else if (currentUrl.includes("disneyplus.com")) {
      handleDisney(preferences);
    }
  }, 1000);
}

function handleNetflix(preferences) {
  const { skipIntro, skipRecap, autoNext, muteNetflixAds } = preferences;

  if (skipIntro) {
    clickFirstMatching(['button[data-uia="player-skip-intro"]']);
  }

  if (skipRecap) {
    clickFirstMatching(['button[data-uia="player-skip-recap"]']);
  }

  if (autoNext) {
    clickFirstMatching(['button[data-uia="next-episode-seamless-button"]']);
  }

  if (muteNetflixAds) {
    handleNetflixAdMuting();
  }
}

function handleYoutube(preferences) {
  const { skipAds } = preferences;
  if (skipAds) {
    const skipAdButton = document.querySelector(
      ".ytp-ad-skip-button-modern, .ytp-ad-skip-button, .ytp-skip-ad-button"
    );
    if (skipAdButton && skipAdButton.style.display !== "none") {
      clickOnce(skipAdButton);
    }

    clickOnce(document.querySelector(".ytp-ad-overlay-close-button"));
  }
}

function handlePrime(preferences) {
  const { skipIntro, skipRecap, autoNext } = preferences;

  // Prime uses the same skip button for intro and recap
  if (skipIntro || skipRecap) {
    clickFirstMatching([
      ".atvwebplayersdk-skipelement-button",
      "button[class*='skipelement']",
      "[class*='skipelement'] button",
    ]);
  }

  if (autoNext) {
    clickFirstMatching([
      ".atvwebplayersdk-nextupcard-button",
      "button[class*='nextupcard']",
    ]);
  }
}

function handleCrave(preferences) {
  const { skipIntro, skipRecap, autoNext } = preferences;

  if (skipIntro) {
    clickFirstMatching(['button[aria-label="Skip Intro"]']);
  }

  if (skipRecap) {
    clickFirstMatching(['button[aria-label="Skip Recap"]']);
  }

  if (autoNext) {
    clickFirstMatching(['button[aria-label="Play next content"]']);
  }
}

function handleDisney(preferences) {
  const { skipIntro, autoNext } = preferences;

  if (skipIntro) {
    clickFirstMatching([".skip__button", "button[class*='skip__button']"]);
  }

  if (autoNext) {
    // The label contains a countdown (e.g. "NEXT EPISODE IN 8"), so match a
    // case-insensitive substring instead of the full label.
    clickFirstMatching(["button[aria-label*='next episode' i]"]);
  }
}

function stopSkipFeatures() {
  restoreNetflixAdMute();
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
}

function restoreNetflixAdMute() {
  for (const video of window.adMuteState.mutedVideos) {
    video.muted = false;
  }
  window.adMuteState.mutedVideos.clear();
}

function handleNetflixAdMuting() {
  if (!document.querySelector('[data-uia="ads-info-text"]')) {
    restoreNetflixAdMute();
    return;
  }

  // Mute videos directly. Clicking the volume control pins the player chrome.
  for (const video of document.querySelectorAll("video")) {
    if (!video.muted) {
      window.adMuteState.mutedVideos.add(video);
      // Netflix can reset muted during an ad, so reapply it until muting is disabled.
      video.muted = true;
    }
  }
}

(function cleanup() {
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
})();

// Single storage handler for both initial load and changes
function handleStorageUpdate(result) {
  if (Object.values(result).some(val => val)) {
    startSkipFeatures(result);
  } else {
    stopSkipFeatures();
  }
}

// Initial load
chrome.storage.sync.get(["skipIntro", "skipRecap", "autoNext", "skipAds"])
  .then(handleStorageUpdate)
  .catch(error => console.error("Error loading preferences:", error));

// Listen for changes
chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync.get(["skipIntro", "skipRecap", "autoNext", "skipAds"])
    .then(handleStorageUpdate)
    .catch(error => console.error("Error updating preferences:", error));
});

function startSkipFeatures(preferences) {
  stopSkipFeatures();
  
  console.log("Starting skip features with preferences:", preferences);
  window.skipFeatureInterval = setInterval(() => {
    const currentUrl = window.location.href;
    
    if (currentUrl.includes("netflix.com")) {
      handleNetflix(preferences);
    } else if (currentUrl.includes("youtube.com")) {
      handleYoutube(preferences);
    } else if (currentUrl.includes("primevideo.com")) {
      handlePrime(preferences);
    } else if (currentUrl.includes("crave.ca")) {
      handleCrave(preferences);
    } else if (currentUrl.includes("disneyplus.com")) {
      handleDisney(preferences);
    }
  }, 1000);
}

function handleNetflix(preferences) {
  const { skipIntro, skipRecap, autoNext } = preferences;
  
  if (skipIntro) {
    const skipIntroButton = document.querySelector('button[data-uia="player-skip-intro"]');
    if (skipIntroButton) skipIntroButton.click();
  }
  
  if (skipRecap) {
    const skipRecapButton = document.querySelector('button[data-uia="player-skip-recap"]');
    if (skipRecapButton) skipRecapButton.click();
  }
  
  if (autoNext) {
    const nextEpisodeButton = document.querySelector('button[data-uia="next-episode-seamless-button"]');
    if (nextEpisodeButton) nextEpisodeButton.click();
  }
}

function handleYoutube(preferences) {
  const { skipAds } = preferences;
  if (skipAds) {
    const skipAdButton = document.querySelector(".ytp-skip-ad-button");
    if (skipAdButton && skipAdButton.style.display !== "none") {
      skipAdButton.click();
    }
    
    const closeOverlayButton = document.querySelector(".ytp-ad-overlay-close-button");
    if (closeOverlayButton) {
      closeOverlayButton.click();
    }
  }
}

function handlePrime(preferences) {
  const { skipIntro, skipRecap } = preferences;
  
  if (skipIntro || skipRecap) { // Prime uses same button for both
    const skipButton = document.querySelector(".atvwebplayersdk-skipelement-button");
    if (skipButton) skipButton.click();
  }
}

function handleCrave(preferences) {
  const { skipIntro, autoNext } = preferences;
  
  if (skipIntro) {
    const skipIntroButton = document.querySelector('button[aria-label="Skip Intro"]');
    if (skipIntroButton) skipIntroButton.click();
  }
  
  if (autoNext) {
    const nextEpisodeButton = document.querySelector('button[aria-label="Play next content"]');
    if (nextEpisodeButton) nextEpisodeButton.click();
  }
}

function handleDisney(preferences) {
  const { skipIntro, autoNext } = preferences;
  
  if (skipIntro) {
    const skipIntroButton = document.querySelector('button[data-testid="skip-credits"]');
    if (skipIntroButton) skipIntroButton.click();
  }
  
  if (autoNext) {
    const nextEpisodeButton = document.querySelector('button[data-testid="next-episode-button"]');
    if (nextEpisodeButton) nextEpisodeButton.click();
  }
}

function stopSkipFeatures() {
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
}

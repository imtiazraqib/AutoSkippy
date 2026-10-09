(function cleanup() {
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
})();

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

// Listen for changes
chrome.storage.onChanged.addListener(() => {
  chrome.storage.sync
    .get(["skipIntro", "skipRecap", "autoNext", "skipAds", "muteNetflixAds"])
    .then(handleStorageUpdate)
    .catch((error) => console.error("Error updating preferences:", error));
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
  const { skipIntro, skipRecap, autoNext, muteNetflixAds } = preferences;

  if (skipIntro) {
    const skipIntroButton = document.querySelector(
      'button[data-uia="player-skip-intro"]'
    );
    if (skipIntroButton) skipIntroButton.click();
  }

  if (skipRecap) {
    const skipRecapButton = document.querySelector(
      'button[data-uia="player-skip-recap"]'
    );
    if (skipRecapButton) skipRecapButton.click();
  }

  if (autoNext) {
    const nextEpisodeButton = document.querySelector(
      'button[data-uia="next-episode-seamless-button"]'
    );
    if (nextEpisodeButton) nextEpisodeButton.click();
  }

  if (muteNetflixAds) {
    handleNetflixAdMuting();
  }
}

function handleYoutube(preferences) {
  const { skipAds } = preferences;
  if (skipAds) {
    const skipAdButton = document.querySelector(".ytp-ad-skip-button-modern");
    if (skipAdButton && skipAdButton.style.display !== "none") {
      skipAdButton.click();
    }

    const closeOverlayButton = document.querySelector(
      ".ytp-ad-overlay-close-button"
    );
    if (closeOverlayButton) {
      closeOverlayButton.click();
    }
  }
}

function handlePrime(preferences) {
  const { skipIntro, skipRecap } = preferences;

  if (skipIntro || skipRecap) {
    // Prime uses same button for both
    const skipButton = document.querySelector(
      ".atvwebplayersdk-skipelement-button"
    );
    if (skipButton) skipButton.click();
  }
}

function handleCrave(preferences) {
  const { skipIntro, skipRecap, autoNext } = preferences;

  if (skipIntro) {
    const skipIntroButton = document.querySelector(
      'button[aria-label="Skip Intro"]'
    );
    if (skipIntroButton) skipIntroButton.click();
  }

  if (skipRecap) {
    const skipRecapButton = document.querySelector(
      'button[aria-label="Skip Recap"]'
    );
    if (skipRecapButton) skipRecapButton.click();
  }

  if (autoNext) {
    const nextEpisodeButton = document.querySelector(
      'button[aria-label="Play next content"]'
    );
    if (nextEpisodeButton) nextEpisodeButton.click();
  }
}

function handleDisney(preferences) {
  const { skipIntro, autoNext } = preferences;

  if (skipIntro) {
    const skipIntroButton = document.querySelector(".skip__button");
    if (skipIntroButton) {
      setTimeout(() => {
        skipIntroButton.click();
      }, 2000); // Delay to allow skip button to disappear once pressed
    }
  }
  if (autoNext) {
    const nextEpisodeButton = document.querySelector(
      'button[aria-label="NEXT EPISODE IN 8"]'
    );
    if (nextEpisodeButton) nextEpisodeButton.click();
  }
}

function stopSkipFeatures() {
  if (window.skipFeatureInterval) {
    clearInterval(window.skipFeatureInterval);
    window.skipFeatureInterval = null;
  }
}

// Track ad mute so we only restore volume we actually muted
let isAdCurrentlyPlaying = false;
let weMutedForAd = false;

// Mute the video element directly — clicking Netflix's volume control
// leaves the slider open and pins the player chrome.
function setNetflixVideosMuted(muted) {
  for (const video of document.querySelectorAll("video")) {
    video.muted = muted;
  }
}

function handleNetflixAdMuting() {
  const adPlaying = !!document.querySelector('[data-uia="ads-info-text"]');
  const videos = document.querySelectorAll("video");
  if (!videos.length) return;

  if (adPlaying) {
    if (!isAdCurrentlyPlaying) {
      const anyUnmuted = [...videos].some((v) => !v.muted);
      if (anyUnmuted) {
        setNetflixVideosMuted(true);
        weMutedForAd = true;
        console.log("AutoSkippy: Muted Netflix ad");
      }
      isAdCurrentlyPlaying = true;
    } else if (weMutedForAd) {
      // Netflix may fight muted mid-ad
      setNetflixVideosMuted(true);
    }
  } else if (isAdCurrentlyPlaying) {
    if (weMutedForAd) {
      setNetflixVideosMuted(false);
      console.log("AutoSkippy: Restored Netflix volume after ad");
    }
    isAdCurrentlyPlaying = false;
    weMutedForAd = false;
  }
}

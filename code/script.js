let interval;

chrome.storage.sync.get(["extensionEnabled"], function (result) {
  if (result.extensionEnabled) {
    startSkipIntro();
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.extensionEnabled) {
    if (changes.extensionEnabled.newValue) {
      startSkipIntro();
    } else {
      stopSkipIntro();
    }
  }
});

function startSkipIntro() {
  if (interval) return;
  interval = setInterval(() => {
    const skipButton = document.querySelector('button[data-uia="player-skip-intro"]');
    const nextEpisodeButton = document.querySelector('button[data-uia="next-episode-seamless-button"]');
    if (skipButton) {
      skipButton.click();
    } else if (nextEpisodeButton) {
      nextEpisodeButton.click();
    }
  }, 1000);
}

function stopSkipIntro() {
  clearInterval(interval);
  interval = null;
}

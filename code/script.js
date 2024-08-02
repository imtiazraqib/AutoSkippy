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

  console.log("Starting skip intro/ads interval...");
  interval = setInterval(() => {
    const netflixSkipButton = document.querySelector('button[data-uia="player-skip-intro"]');
    const netflixNextEpisodeButton = document.querySelector('button[data-uia="next-episode-seamless-button"]');
    const youtubeSkipAdButton = document.querySelector(".ytp-skip-ad-button");

    if (netflixSkipButton) {
      console.log("Netflix skip intro button found.");
      netflixSkipButton.click();
    } else if (netflixNextEpisodeButton) {
      console.log("Netflix next episode button found.");
      netflixNextEpisodeButton.click();
    } else if (youtubeSkipAdButton && youtubeSkipAdButton.style.display !== "none") {
      console.log("YouTube skip ad button found.");
      youtubeSkipAdButton.click();
    } else {
      console.log("No actionable buttons found.");
    }
  }, 1000);
}

function stopSkipIntro() {
  clearInterval(interval);
  interval = null;
}

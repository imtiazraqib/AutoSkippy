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
    const netflixSkipRecapButton = document.querySelector('button[data-uia="player-skip-recap"]');
    const youtubeSkipAdButton = document.querySelector(".ytp-skip-ad-button");
    const primeSkipButton = document.querySelector(".atvwebplayersdk-skipelement-button");
    const craveSkipIntroButton = document.querySelector('button[aria-label="Skip Intro"]');
    const craveNextEpisodeButton = document.querySelector('button[aria-label="Play next content"]');
    const disneySkipIntroButton = document.querySelector('button[data-testid="skip-credits"]');
    const disneyNextEpisodeButton = document.querySelector('button[data-testid="next-episode-button"]');

    if (netflixSkipButton) {
      netflixSkipButton.click();
    } else if (netflixNextEpisodeButton) {
      netflixNextEpisodeButton.click();
    } else if (netflixSkipRecapButton) {
      netflixSkipRecapButton.click();
    } else if (youtubeSkipAdButton && youtubeSkipAdButton.style.display !== "none") {
      youtubeSkipAdButton.click();
    } else if (primeSkipButton) {
      primeSkipButton.click();
    } else if (craveSkipIntroButton) {
      craveSkipIntroButton.click();
    } else if (craveNextEpisodeButton) {
      craveNextEpisodeButton.click();
    } else if (disneySkipIntroButton) {
      disneySkipIntroButton.click();
    } else if (disneyNextEpisodeButton) {
      disneyNextEpisodeButton.click();
    } else {
      console.log("No actionable buttons found.");
    }
  }, 1000);
}

function stopSkipIntro() {
  clearInterval(interval);
  interval = null;
}

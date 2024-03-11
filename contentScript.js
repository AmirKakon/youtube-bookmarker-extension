(() => {
  let youtubeLeftControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  const fetchBookmarks = async () => {
    const obj = await chrome.storage.sync.get([currentVideo]);
    return obj[currentVideo] ? JSON.parse(obj[currentVideo]) : [];
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: `Bookmark at ${getTime(currentTime)}`,
    };

    currentVideoBookmarks = await fetchBookmarks();
    const updatedBookmarks = [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time);

    chrome.storage.sync.set({ [currentVideo]: JSON.stringify(updatedBookmarks) });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.querySelector(".bookmark-btn");

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");
      bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtn.className = "ytp-button bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeLeftControls = document.querySelector(".ytp-left-controls");
      youtubePlayer = document.querySelector('.video-stream');

      youtubeLeftControls.appendChild(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  chrome.runtime.onMessage.addListener(({ type, value, videoId }, sender, response) => {
    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
      chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });
      response(currentVideoBookmarks);
    }
  });

  newVideoLoaded();
})();

const getTime = (t) => {
  const date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().substr(11, 8);
};

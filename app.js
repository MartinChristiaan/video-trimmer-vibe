const app = document.getElementById('app');
const videoSelection = document.getElementById('video-selection');
const videoList = document.getElementById('video-list');
const trimmingView = document.getElementById('trimming-view');
const videoPlayer = document.getElementById('video-player');
const previewScroll = document.getElementById('preview-scroll');
const confirmTrimBtn = document.getElementById('confirm-trim');
const backBtn = document.getElementById('back-btn');
const videoTitle = document.getElementById('video-title');

let selectedVideo = null;
let trimStart = null;
let trimEnd = null;
let videos = [];

async function fetchVideos() {
    const res = await fetch('/videos');
    videos = await res.json();
    renderVideoSelection();
}

function renderVideoSelection() {
    videoList.innerHTML = '';
    videos.forEach((video, idx) => {
        const row = document.createElement('div');
        row.className = 'video-row';
        row.onclick = () => openTrimmingView(idx);
        const title = document.createElement('span');
        title.textContent = video.name;
        const previews = document.createElement('div');
        previews.className = 'preview-images';
        video.previews.slice(0,4).forEach(p => {
            const img = document.createElement('img');
            img.src = p.src;
            img.className = 'preview-img';
            previews.appendChild(img);
        });
        row.appendChild(title);
        row.appendChild(previews);
        videoList.appendChild(row);
    });
}

function openTrimmingView(idx) {
    selectedVideo = videos[idx];
    trimStart = null;
    trimEnd = null;
    videoSelection.style.display = 'none';
    trimmingView.style.display = '';
    videoTitle.textContent = selectedVideo.name;
    videoPlayer.src = `/video/${selectedVideo.file}`;
    renderPreviewScroll();
    confirmTrimBtn.style.display = 'none';
}

function renderPreviewScroll() {
    previewScroll.innerHTML = '';
    selectedVideo.previews.forEach((p, i) => {
        const img = document.createElement('img');
        img.src = p.src;
        img.className = 'preview-img';
        img.onclick = () => selectPreview(i);
        if (trimStart !== null && trimEnd !== null) {
            if (i >= trimStart && i <= trimEnd) {
                img.classList.add('in-trim');
            } else {
                img.classList.add('out-trim');
            }
        } else if (i === trimStart) {
            img.classList.add('selected');
        }
        previewScroll.appendChild(img);
    });
}

function selectPreview(i) {
    if (trimStart === null) {
        trimStart = i;
        videoPlayer.currentTime = selectedVideo.previews[i].time;
    } else if (trimEnd === null && i > trimStart) {
        trimEnd = i;
        videoPlayer.currentTime = selectedVideo.previews[i].time;
        confirmTrimBtn.style.display = '';
    } else {
        trimStart = i;
        trimEnd = null;
        videoPlayer.currentTime = selectedVideo.previews[i].time;
        confirmTrimBtn.style.display = 'none';
    }
    renderPreviewScroll();
}

confirmTrimBtn.onclick = async function() {
    if (trimStart !== null && trimEnd !== null) {
        // POST trim info to backend
        const res = await fetch('/trim', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                video: selectedVideo.file,
                start: selectedVideo.previews[trimStart].time,
                end: selectedVideo.previews[trimEnd].time
            })
        });
        if (res.ok) {
            alert(`Trim confirmed for ${selectedVideo.name}:\nStart=${selectedVideo.previews[trimStart].time}s, End=${selectedVideo.previews[trimEnd].time}s`);
        } else {
            alert('Error saving trim!');
        }
        // Stay on trimming view and reset trim selection
        trimStart = null;
        trimEnd = null;
        confirmTrimBtn.style.display = 'none';
        renderPreviewScroll();
    }
};

backBtn.onclick = function() {
    trimmingView.style.display = 'none';
    videoSelection.style.display = '';
    trimStart = null;
    trimEnd = null;
};

fetchVideos();

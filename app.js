// DOM Elements
const app = document.getElementById('app');
const videoSelection = document.getElementById('video-selection');
const videoList = document.getElementById('video-list');
const trimmingView = document.getElementById('trimming-view');
const videoPlayer = document.getElementById('video-player');
const previewScroll = document.getElementById('preview-scroll');
const confirmTrimBtn = document.getElementById('confirm-trim');
const backBtn = document.getElementById('back-btn');
const videoTitle = document.getElementById('video-title');
const trimNameInput = document.getElementById('trim-name');

// State
let selectedVideo = null;
let trimStart = null;
let trimEnd = null;
let videos = [];
let existingTrims = [];
let existingTrimFrames = new Set();

// API Calls
async function fetchVideos() {
    const res = await fetch('/videos');
    videos = await res.json();
    renderVideoSelection();
}

async function fetchClips(videoFile) {
    const res = await fetch(`/clips/${videoFile}`);
    return await res.json();
}

async function fetchExistingTrims(videoFile) {
    const base = videoFile.split('.')[0];
    try {
        const res = await fetch(`/trims/${base}`);
        if (res.ok) {
            const text = await res.text();
            return text.trim().split('\n').map(line => {
                const [start, end, name] = line.split(',');
                return {start: Number(start), end: Number(end), name};
            });
        }
    } catch {
        // No trims file
    }
    return [];
}

// UI Rendering
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
        video.previews.slice(0, 4).forEach(p => {
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

function renderClipsList(clips) {
    const clipsList = document.getElementById('clips-list');
    clipsList.innerHTML = '';
    clips.forEach(clip => {
        const div = document.createElement('div');
        div.className = 'clip-item';
        const video = document.createElement('video');
        video.src = `/clip/${clip}`;
        video.controls = true;
        div.appendChild(video);
        const label = document.createElement('span');
        label.textContent = clip;
        div.appendChild(label);
        clipsList.appendChild(div);
    });
}

function renderPreviewScroll() {
    previewScroll.innerHTML = '';
    selectedVideo.previews.forEach((p, i) => {
        const img = document.createElement('img');
        img.src = p.src;
        img.className = 'preview-img';
        img.onclick = () => selectPreview(i);
        if (existingTrimFrames.has(p.time)) {
            img.classList.add('in-existing-trim');
        }
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

// Trimming View Logic
async function openTrimmingView(idx) {
    selectedVideo = videos[idx];
    trimStart = null;
    trimEnd = null;
    videoSelection.style.display = 'none';
    trimmingView.style.display = '';
    videoTitle.textContent = selectedVideo.name;
    videoPlayer.src = `/video/${selectedVideo.file}`;
    confirmTrimBtn.style.display = 'none';
    backBtn.style.display = '';
    // Fetch and show clips
    const clips = await fetchClips(selectedVideo.file);
    renderClipsList(clips);
    // Fetch trims and mark frames
    existingTrims = await fetchExistingTrims(selectedVideo.file);
    existingTrimFrames = new Set();
    existingTrims.forEach(trim => {
        for (let t = trim.start; t <= trim.end; t++) {
            existingTrimFrames.add(t);
        }
    });
    renderPreviewScroll();
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

// Event Handlers
confirmTrimBtn.onclick = async function() {
    if (trimStart !== null && trimEnd !== null) {
        const trimName = trimNameInput.value.trim();
        const res = await fetch('/trim', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                video: selectedVideo.file,
                start: selectedVideo.previews[trimStart].time,
                end: selectedVideo.previews[trimEnd].time,
                name: trimName
            })
        });
        if (res.ok) {
            alert(`Trim confirmed for ${selectedVideo.name}:\nName: ${trimName}\nStart=${selectedVideo.previews[trimStart].time}s, End=${selectedVideo.previews[trimEnd].time}s`);
        } else {
            alert('Error saving trim!');
        }
        trimStart = null;
        trimEnd = null;
        confirmTrimBtn.style.display = 'none';
        trimNameInput.value = '';
        // Refresh clips and trims after saving
        const clips = await fetchClips(selectedVideo.file);
        renderClipsList(clips);
        existingTrims = await fetchExistingTrims(selectedVideo.file);
        existingTrimFrames = new Set();
        existingTrims.forEach(trim => {
            for (let t = trim.start; t <= trim.end; t++) {
                existingTrimFrames.add(t);
            }
        });
        renderPreviewScroll();
    }
};

backBtn.onclick = function() {
    trimmingView.style.display = 'none';
    videoSelection.style.display = '';
    trimStart = null;
    trimEnd = null;
};

// Init
fetchVideos();

const allClipsList = document.getElementById('all-clips-list');

async function fetchAllClips() {
    const res = await fetch('/allclips');
    return await res.json();
}

function renderAllClipsList(clips) {
    allClipsList.innerHTML = '';
    clips.forEach(clip => {
        const div = document.createElement('div');
        div.className = 'clip-item';
        const label = document.createElement('span');
        label.textContent = clip;
        div.appendChild(label);
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.style.margin = '8px 0';
        playBtn.onclick = function() {
            // Remove any existing video
            const oldVideo = div.querySelector('video');
            if (oldVideo) div.removeChild(oldVideo);
            // Add video player
            const video = document.createElement('video');
            video.src = `/clip/${clip}`;
            video.controls = true;
            video.autoplay = true;
            video.style.width = '180px';
            video.style.height = '120px';
            div.appendChild(video);
        };
        div.appendChild(playBtn);
        allClipsList.appendChild(div);
    });
}

// Initial render
fetchAllClips().then(renderAllClipsList);

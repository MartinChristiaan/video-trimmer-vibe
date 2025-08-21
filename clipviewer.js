const allClipsList = document.getElementById('all-clips-list');

async function fetchAllClips() {
    const res = await fetch('/allclips');
    return await res.json();
}

function renderAllClipsList(clips) {
    allClipsList.innerHTML = '';
    const playerArea = document.getElementById('player-area');
    playerArea.innerHTML = '';
    clips.forEach((obj, idx) => {
        const {clip, thumb} = obj;
        const div = document.createElement('div');
        div.className = 'clip-item mosaic-item';
        div.style.position = 'relative';
        // Thumbnail image
        if (thumb) {
            const img = document.createElement('img');
            img.src = thumb;
            img.alt = 'Clip thumbnail';
            img.className = 'clip-thumb';
            img.onclick = function() {
                // Remove highlight from all mosaic items
                document.querySelectorAll('.clip-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                // Highlight this item
                div.classList.add('selected');
                // Play video in right column
                playerArea.innerHTML = '';
                const video = document.createElement('video');
                video.src = `/clip/${clip}`;
                video.controls = true;
                video.autoplay = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.borderRadius = '10px';
                video.style.boxShadow = '0 4px 24px rgba(67,206,162,0.18)';
                playerArea.appendChild(video);
                // Show filename below video
                const label = document.createElement('span');
                label.textContent = clip;
                label.style.display = 'block';
                label.style.textAlign = 'center';
                label.style.marginTop = '8px';
                label.style.color = '#43cea2';
                label.style.fontWeight = 'bold';
                playerArea.appendChild(label);
            };
            div.appendChild(img);
        }
        // Clip filename label
        // const label = document.createElement('span');
        // label.textContent = clip;
        // div.appendChild(label);
        allClipsList.appendChild(div);
    });
}

// Initial render
fetchAllClips().then(renderAllClipsList);

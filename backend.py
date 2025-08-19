import glob
import os
import subprocess

from flask import Flask, jsonify, request, send_file, send_from_directory

ROOT_DIR = '/diskstation/personal/'
VIDEO_DIR = f'{ROOT_DIR}/raw/'
PREVIEW_DIR = f'{ROOT_DIR}/previews/'
TRIM_DIR = f'{ROOT_DIR}/trims/'
CLIP_DIR = f'{ROOT_DIR}./clips/'

app = Flask(__name__)

# Ensure trim and clip directories exist
os.makedirs(TRIM_DIR, exist_ok=True)
os.makedirs(CLIP_DIR, exist_ok=True)

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/app.js')
def app_js():
    return send_file('app.js')

@app.route('/style.css')
def style_css():
    return send_file('style.css')

@app.route('/videos')
def list_videos():
    video_files = [f for f in os.listdir(VIDEO_DIR) if f.lower().endswith(('.mp4', '.mov', '.avi'))]
    videos = []
    for vf in video_files:
        base = os.path.splitext(vf)[0]
        # Find preview images for this video
        preview_pattern = os.path.join(PREVIEW_DIR, f'{vf}/frame_*.jpg')
        previews = sorted(glob.glob(preview_pattern))
        preview_objs = []
        for p in previews:
            frame_str = os.path.basename(p).replace('frame_', '').replace('.jpg', '')
            preview_objs.append({
                'src': f'/preview/{vf}/{frame_str}',
                'time': int(frame_str)
            })
        videos.append({
            'name': base,
            'file': vf,
            'previews': preview_objs
        })
    return jsonify(videos)

@app.route('/preview/<video>/<timestamp>')
def get_preview(video, timestamp):
    filename = f'frame_{str(timestamp).zfill(6)}.jpg' if len(str(timestamp)) < 6 else f'frame_{timestamp}.jpg'
    preview_path = os.path.join(PREVIEW_DIR, video)
    return send_from_directory(preview_path, filename)

@app.route('/video/<video>')
def get_video(video):
    return send_from_directory(VIDEO_DIR, video)

@app.route('/trim', methods=['POST'])
def save_trim():
    data = request.json
    video = data.get('video')
    start = data.get('start')
    end = data.get('end')
    name = data.get('name', '')
    if not video or start is None or end is None:
        return jsonify({'error': 'Missing parameters'}), 400
    base = os.path.splitext(video)[0]
    trim_file = os.path.join(TRIM_DIR, f'{base}_trims.txt')
    with open(trim_file, 'a') as f:
        f.write(f'{start},{end},{name}\n')
    # Run ffmpeg to create the trimmed video
    input_path = os.path.join(VIDEO_DIR, video)
    # Sanitize name for filename
    safe_name = name.replace(' ', '_').replace('/', '_') if name else f'{start}_{end}'
    output_file = f'{base}_clip_{safe_name}.mp4'
    output_path = os.path.join(CLIP_DIR, output_file)
    duration = int(end) - int(start)
    ffmpeg_cmd = [
        'ffmpeg',
        '-y',
        '-i', input_path,
        '-ss', str(start),
        '-t', str(duration),
        '-c', 'copy',
        output_path
    ]
    try:
        subprocess.run(ffmpeg_cmd, check=True)
    except Exception as e:
        return jsonify({'error': f'ffmpeg failed: {e}'}), 500
    return jsonify({'status': 'ok', 'clip': output_file})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

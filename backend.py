from flask import Flask, jsonify, send_from_directory, request, send_file
import os
import glob

VIDEO_DIR = '/diskstation/personal/raw/'
PREVIEW_DIR = '/diskstation/personal/previews/'
TRIM_DIR = './trims/'

app = Flask(__name__)

# Ensure trim directory exists
os.makedirs(TRIM_DIR, exist_ok=True)

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
    if not video or start is None or end is None:
        return jsonify({'error': 'Missing parameters'}), 400
    base = os.path.splitext(video)[0]
    trim_file = os.path.join(TRIM_DIR, f'{base}_trims.txt')
    with open(trim_file, 'a') as f:
        f.write(f'{start},{end}\n')
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

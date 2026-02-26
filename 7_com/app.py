from flask import Blueprint, render_template, request, jsonify
import requests
import threading
import time

com_bp = Blueprint('com', __name__, template_folder='../templates')

devices = [{'name': 'Duet3D 3D Printer', 'url': 'http://192.168.1.100', 'type': '3D Printer'}, {'name': 'Medical Sensor Hub', 'url': 'http://192.168.1.200', 'type': 'Sensor'}]

@com_bp.route('/')
def index():
    return render_template('com_index.html', devices=devices)

@com_bp.route('/status/<int:device_id>')
def device_status(device_id):
    device = devices[device_id - 1] if device_id <= len(devices) else None
    if not device:
        return jsonify({'status': 'error', 'msg': 'Device not found'})
    try:
        resp = requests.get(f"{device['url']}/rr_status", timeout=5)  # RepRap API
        if resp.status_code == 200:
            return jsonify({'status': 'connected', 'data': resp.json()})
        else:
            return jsonify({'status': 'error', 'msg': f'HTTP {resp.status_code}'})
    except:
        return jsonify({'status': 'disconnected', 'msg': 'Cannot reach device'})

@com_bp.route('/ai_predict/<int:device_id>')
def ai_predict(device_id):
    device = devices[device_id - 1] if device_id <= len(devices) else None
    if device and device['type'] == 'Sensor':
        return jsonify({'prediction': 'Maintenance needed soon (AI simulated)', 'confidence': 0.85})
    return jsonify({'prediction': 'Not applicable'})

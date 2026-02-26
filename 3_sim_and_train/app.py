from flask import Blueprint, render_template, jsonify, request, send_file
import json
import time
import io
import csv
import os

sim_bp = Blueprint('sim_and_train', __name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'), template_folder=os.path.join(os.path.dirname(__file__), 'templates'))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCENARIOS_DIR = os.path.join(BASE_DIR, 'scenarios')
LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

@sim_bp.route('/')
def index():
    scenarios = []
    for fn in os.listdir(SCENARIOS_DIR):
        if fn.endswith('.json'):
            with open(os.path.join(SCENARIOS_DIR, fn),'r',encoding='utf-8') as f:
                meta = json.load(f).get('meta', {})
            scenarios.append({'id': fn.replace('.json',''), 'file': fn, 'meta': meta})
    return render_template('sim_index.html', scenarios=scenarios)

@sim_bp.route('/simulator/<scenario_id>')
def simulator(scenario_id):
    return render_template('simulator.html', scenario_id=scenario_id)

@sim_bp.route('/api/scenario/<scenario_id>')
def api_scenario(scenario_id):
    path = os.path.join(SCENARIOS_DIR, f'{scenario_id}.json')
    if not os.path.exists(path):
        return jsonify({'error':'not found'}), 404
    with open(path,'r',encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@sim_bp.route('/api/evaluate', methods=['POST'])
def api_evaluate():
    payload = request.get_json()
    events = payload.get('events', [] )
    start = payload.get('start_time')
    end = payload.get('end_time')
    scenario_id = payload.get('scenario_id')

    duration = None
    if start and end:
        try:
            duration = float(end) - float(start)
        except Exception:
            duration = None

    distances = [e.get('distance_to_target') for e in events if 'distance_to_target' in e]
    avg_distance = None
    if distances:
        import numpy as _np
        avg_distance = float(_np.mean(distances))

    result = {
        'duration_s': duration,
        'avg_distance_mm': avg_distance,
        'events_count': len(events)
    }
    # Add additional metrics: min/max/std distances, error count if scenario defines a radius
    if distances:
        import math
        result['min_distance_mm'] = float(min(distances))
        result['max_distance_mm'] = float(max(distances))
        # compute sample standard deviation
        mean_d = float(sum(distances)/len(distances))
        var = sum((d-mean_d)**2 for d in distances) / len(distances)
        result['std_distance_mm'] = math.sqrt(var)
    # Try to evaluate against scenario rules
    if scenario_id:
        s_path = os.path.join(SCENARIOS_DIR, f"{scenario_id}.json")
        if os.path.exists(s_path):
            try:
                with open(s_path, 'r', encoding='utf-8') as sf:
                    sdata = json.load(sf)
                target_radius_mm = sdata.get('scene', {}).get('target_radius_mm')
                if target_radius_mm is not None:
                    errors = [d for d in distances if d > float(target_radius_mm)]
                    result['errors_count'] = len(errors)
                    result['target_radius_mm'] = float(target_radius_mm)
                    result['success'] = (len(errors) == 0)
                # path deviation calculation
                path_pts = sdata.get('scene', {}).get('path_points')
                if path_pts and len(path_pts)>0:
                    # build path points in meters
                    pts = [(float(p['x']), float(p['y']), float(p['z'])) for p in path_pts]
                    def dist_to_path(px,py,pz):
                        best = None
                        for (ax,ay,az) in pts:
                            d = ((px-ax)**2 + (py-ay)**2 + (pz-az)**2)**0.5
                            if best is None or d<best: best = d
                        return best*1000.0
                    path_dists = [dist_to_path(e.get('x',0), e.get('y',0), e.get('z',0)) for e in events if 'x' in e and 'y' in e and 'z' in e]
                    if path_dists:
                        result['path_avg_deviation_mm'] = float(sum(path_dists)/len(path_dists))
                        result['path_max_deviation_mm'] = float(max(path_dists))
            except Exception:
                pass
    # persist evaluation log
    try:
        ts = int(time.time())
        pretty_ts = time.strftime('%Y-%m-%d_%H-%M-%S', time.localtime(ts))
        fname = f"{pretty_ts}_{scenario_id or 'anon'}.json"
        log_obj = {
            'timestamp': ts,
            'timestamp_pretty': pretty_ts,
            'scenario_id': scenario_id,
            'payload': payload,
            'result': result
        }
        with open(os.path.join(LOGS_DIR, fname),'w',encoding='utf-8') as lf:
            json.dump(log_obj, lf, indent=2)
        result['log_file'] = fname
    except Exception:
        pass
    return jsonify(result)

    # persist log: (unreachable since returned earlier) kept for backward-compatibility


@sim_bp.route('/api/export_json', methods=['POST'])
def api_export_json():
    payload = request.get_json()
    # return JSON as a downloadable file
    mem = io.BytesIO()
    mem.write(json.dumps(payload, indent=2).encode('utf-8'))
    mem.seek(0)
    return send_file(mem, mimetype='application/json', as_attachment=True, download_name='training_metrics.json')


@sim_bp.route('/results', methods=['GET','POST'])
def results():
    if request.method == 'POST':
        # Accept either JSON body or form field 'result'
        try:
            data = request.get_json()
        except Exception:
            data = None
        if data is None:
            # maybe a form post
            data_str = request.form.get('result', '')
        else:
            data_str = json.dumps(data, indent=2)

        return render_template('results.html', result=data_str)
    else:
        return render_template('results.html', result=None)


@sim_bp.route('/logs')
def logs():
    files = sorted([f for f in os.listdir(LOGS_DIR) if f.endswith('.json')], reverse=True)
    return render_template('logs.html', logs=files)


@sim_bp.route('/api/logs')
def api_logs():
    files = sorted([f for f in os.listdir(LOGS_DIR) if f.endswith('.json')], reverse=True)
    # return filenames + basic info
    out = []
    for f in files:
        try:
            with open(os.path.join(LOGS_DIR, f),'r',encoding='utf-8') as fh:
                d = json.load(fh)
            out.append({'file': f, 'timestamp': d.get('timestamp'), 'scenario_id': d.get('scenario_id')})
        except Exception:
            out.append({'file': f})
    return jsonify(out)


@sim_bp.route('/api/log/<filename>')
def api_log(filename):
    safe = os.path.basename(filename)
    path = os.path.join(LOGS_DIR, safe)
    if not os.path.exists(path):
        return jsonify({'error':'not found'}), 404
    return send_file(path, mimetype='application/json', as_attachment=True, download_name=safe)

@sim_bp.route('/api/export_csv', methods=['POST'])
def api_export_csv():
    payload = request.get_json()
    events = payload.get('events', [])

    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['timestamp','event_type','x','y','z','distance_to_target'])
    for e in events:
        cw.writerow([e.get('ts'), e.get('type'), e.get('x'), e.get('y'), e.get('z'), e.get('distance_to_target')])
    mem = io.BytesIO()
    mem.write(si.getvalue().encode('utf-8'))
    mem.seek(0)
    return send_file(mem, mimetype='text/csv', as_attachment=True, download_name='training_log.csv')

from flask import Flask, render_template, request, redirect, url_for, Blueprint
from werkzeug.utils import secure_filename
import os
import pydicom as dicom
import numpy as np
from skimage import measure
import trimesh

viewer_bp = Blueprint('viewer', __name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'), template_folder=os.path.join(os.path.dirname(__file__), 'templates'))

UPLOAD_FOLDER = os.path.join(viewer_bp.static_folder, 'uploads')
ALLOWED_EXTENSIONS = {'stl', 'obj', 'dcm', 'dicom'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def dicom_to_stl(file_path):
    # Read DICOM file or series
    ds = dicom.dcmread(file_path)
    pixel_data = ds.pixel_array.astype(np.float32)
    if pixel_data.ndim == 2:
        pixel_data = np.expand_dims(pixel_data, axis=0)  # Add slice dimension
    volume = pixel_data / pixel_data.max()  # Normalize to 0-1
    verts, faces, normals, values = measure.marching_cubes(volume, level=0.5)
    mesh = trimesh.Trimesh(vertices=verts, faces=faces)
    stl_path = file_path.replace('.dcm', '.stl').replace('.dicom', '.stl')
    mesh.export(stl_path)
    return stl_path

@viewer_bp.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            return redirect(request.url)
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(viewer_bp.static_folder, 'uploads', filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            ext = filename.rsplit('.', 1)[1].lower()
            if ext in ['dcm', 'dicom']:
                # Convert DICOM to STL
                stl_filepath = dicom_to_stl(filepath)
                stl_filename = os.path.basename(stl_filepath)
                return render_template('viewer.html', model_file=stl_filename)
            else:
                return render_template('viewer.html', model_file=filename)
    return render_template('viewer_index.html')

@viewer_bp.route('/viewer/<filename>')
def viewer(filename):
    return render_template('viewer.html', model_file=f'uploads/{filename}')

@viewer_bp.route('/demo')
def demo():
    return render_template('viewer.html', model_file='tooth.STL')

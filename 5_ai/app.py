import os
from flask import Blueprint, render_template

ai_bp = Blueprint('ai', __name__, template_folder='../templates', root_path=os.path.dirname(os.path.abspath(__file__)))

@ai_bp.route('/')
def index():
    return render_template('ai_index.html')

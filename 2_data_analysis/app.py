from flask import Blueprint, render_template, request, redirect, url_for
import pandas as pd
import os
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend for Flask
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

data_bp = Blueprint('data_analysis', __name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'), template_folder=os.path.join(os.path.dirname(__file__), 'templates'))

UPLOAD_FOLDER = os.path.join(data_bp.static_folder, 'uploads')
PLOTS_FOLDER = os.path.join(data_bp.static_folder, 'plots')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PLOTS_FOLDER, exist_ok=True)

@data_bp.route('/', methods=['GET'])
def index():
    return render_template('data_index.html')

@data_bp.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)
    if file and file.filename.endswith('.csv'):
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        # Read CSV
        df = pd.read_csv(filepath, sep=';')

        # Get all columns
        columns = list(df.columns)
        numerical_cols = list(df.select_dtypes(include=[np.number]).columns)
        categorical_cols = [col for col in columns if col not in numerical_cols]

        return render_template('select_columns.html', columns=columns, numerical_cols=numerical_cols, categorical_cols=categorical_cols, filepath=filepath)
    return redirect(url_for('.index'))

@data_bp.route('/perform_analysis', methods=['POST'])
def perform_analysis():
    filepath = request.form.get('filepath')
    if not filepath or not os.path.exists(filepath):
        return redirect(url_for('.index'))

    selected_cols = request.form.getlist('columns')
    if not selected_cols:
        return "Keine Spalten ausgewählt"

    plot_style = request.form.get('plot_style', 'scientific')

    df = pd.read_csv(filepath, sep=';')

    # Apply plot style
    if plot_style == 'scientific':
        sns.set_style("whitegrid")
        hist_color = 'skyblue'
        box_color = 'lightgreen'
    elif plot_style == 'medical':
        sns.set_style("darkgrid")
        hist_color = 'salmon'
        box_color = 'lightcoral'
    elif plot_style == 'physical':
        sns.set_style("ticks")
        hist_color = 'lightblue'
        box_color = 'steelblue'
    else:
        sns.set_style("whitegrid")
        hist_color = 'skyblue'
        box_color = 'lightgreen'

    stats_list = []
    plot_files = []

    for col in selected_cols:
        if col not in df.columns:
            continue
        data = df[col].dropna()
        if len(data) == 0:
            continue

        # Compute stats
        mean_val = data.mean()
        std_val = data.std()
        min_val = data.min()
        max_val = data.max()

        # Create professional plots with Seaborn
        plt.figure(figsize=(10, 6))
        sns.histplot(data, kde=True, bins=30, color=hist_color, edgecolor='black')
        plt.title(f'Histogramm von {col} ({plot_style})', fontsize=16, fontweight='bold')
        plt.xlabel(col, fontsize=14)
        plt.ylabel('Häufigkeit', fontsize=14)
        plt.grid(True, alpha=0.3)
        plot_filename = f'{col}_histogram_{plot_style}.png'
        plot_path = os.path.join(PLOTS_FOLDER, plot_filename)
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        plt.close()
        plot_files.append(plot_filename)

        plt.figure(figsize=(8, 6))
        sns.boxplot(y=data, color=box_color)
        plt.title(f'Boxplot von {col} ({plot_style})', fontsize=16, fontweight='bold')
        plt.ylabel(col, fontsize=14)
        plt.grid(True, alpha=0.3)
        boxplot_filename = f'{col}_boxplot_{plot_style}.png'
        boxplot_path = os.path.join(PLOTS_FOLDER, boxplot_filename)
        plt.savefig(boxplot_path, dpi=150, bbox_inches='tight')
        plt.close()
        plot_files.append(boxplot_filename)

        stats_list.append({
            'column': col,
            'mean': f"{mean_val:.2f}",
            'std': f"{std_val:.2f}",
            'min': f"{min_val:.2f}",
            'max': f"{max_val:.2f}",
            'histogram': plot_filename,
            'boxplot': boxplot_filename
        })

    # Get all columns for re-selection
    columns = list(df.columns)
    numerical_cols = list(df.select_dtypes(include=[np.number]).columns)

    return render_template('results_multi.html', stats_list=stats_list, plot_files=plot_files, columns=columns, numerical_cols=numerical_cols, selected_cols=selected_cols, plot_style=plot_style, filepath=filepath)

@data_bp.route('/results')
def results():
    return render_template('results.html')

@data_bp.route('/demo')
def demo():
    filepath = os.path.join(UPLOAD_FOLDER, 'testdaten.csv')
    if not os.path.exists(filepath):
        return "Demo file not found"

    # Read CSV
    df = pd.read_csv(filepath, sep=';')

    # Get all numerical columns
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    if len(numerical_cols) == 0:
        return "No numerical columns found"

    stats_list = []
    plot_files = []

    for col in numerical_cols:
        data = df[col].dropna()
        if len(data) == 0:
            continue

        # Compute stats
        mean_val = data.mean()
        std_val = data.std()
        min_val = data.min()
        max_val = data.max()

        # Create professional plots with Seaborn
        plt.figure(figsize=(10, 6))
        sns.histplot(data, kde=True, bins=30, color='skyblue', edgecolor='black')
        plt.title(f'Histogramm von {col}', fontsize=16, fontweight='bold')
        plt.xlabel(col, fontsize=14)
        plt.ylabel('Häufigkeit', fontsize=14)
        plt.grid(True, alpha=0.3)
        plot_filename = f'{col}_histogram.png'
        plot_path = os.path.join(PLOTS_FOLDER, plot_filename)
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        plt.close()
        plot_files.append(plot_filename)

        plt.figure(figsize=(8, 6))
        sns.boxplot(y=data, color='lightgreen')
        plt.title(f'Boxplot von {col}', fontsize=16, fontweight='bold')
        plt.ylabel(col, fontsize=14)
        plt.grid(True, alpha=0.3)
        boxplot_filename = f'{col}_boxplot.png'
        boxplot_path = os.path.join(PLOTS_FOLDER, boxplot_filename)
        plt.savefig(boxplot_path, dpi=150, bbox_inches='tight')
        plt.close()
        plot_files.append(boxplot_filename)

        stats_list.append({
            'column': col,
            'mean': f"{mean_val:.2f}",
            'std': f"{std_val:.2f}",
            'min': f"{min_val:.2f}",
            'max': f"{max_val:.2f}",
            'histogram': plot_filename,
            'boxplot': boxplot_filename
        })

    # Get all columns for re-selection
    columns = list(df.columns)
    numerical_cols = list(df.select_dtypes(include=[np.number]).columns)

    return render_template('results_multi.html', stats_list=stats_list, plot_files=plot_files, columns=columns, numerical_cols=numerical_cols, selected_cols=list(numerical_cols), plot_style='scientific', filepath=filepath)

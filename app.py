from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='go-game')

@app.route('/')
def index():
    return send_from_directory('go-game', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('go-game', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
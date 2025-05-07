from flask import Flask, render_template, request, jsonify
from PIL import Image
import pytesseract
import io
import os
import requests

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'static/uploads'
OCR_API_KEY = 'K81657832088957'  # Your OCR.space API key
CHATBOT_API_KEY = 'fPHhyAPLse6lneEvmUMeXg==q9GDDoUjVFjswKdk'  # API-Ninjas key

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/scan-image", methods=["POST"])
def scan_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        # Option 1: Use local pytesseract
        img = Image.open(io.BytesIO(file.read()))
        local_text = pytesseract.image_to_string(img)
        
        # Option 2: Fallback to OCR.space API if local fails
        if not local_text.strip():
            file.seek(0)  # Reset file pointer
            api_text = ocr_space_api(file)
            return jsonify({"text": api_text, "source": "API"})
            
        return jsonify({"text": local_text, "source": "local"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def ocr_space_api(image_file):
    """Fallback to OCR.space API"""
    url = 'https://api.ocr.space/parse/image'
    payload = {
        'apikey': OCR_API_KEY,
        'language': 'eng',
        'isOverlayRequired': False
    }
    files = {'file': image_file}
    response = requests.post(url, files=files, data=payload)
    response.raise_for_status()
    result = response.json()
    return result['ParsedResults'][0]['ParsedText']

@app.route("/ask-ai", methods=["GET"])
def ask_ai():
    question = request.args.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400
        
    try:
        # Use API-Ninjas chatbot
        response = requests.get(
            'https://api.api-ninjas.com/v1/chatbot',
            headers={'X-Api-Key': CHATBOT_API_KEY},
            params={'message': question}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        # Fallback to simple response if API fails
        return jsonify({
            "response": f"I couldn't connect to the health advisor. Please try again later. (Original question: {question})"
        })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
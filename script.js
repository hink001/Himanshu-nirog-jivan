// DOM Elements
const fileInput = document.getElementById('imageUpload');
const resultDiv = document.getElementById('result');
const queryInput = document.getElementById('userQuery');
const responseDiv = document.getElementById('response');

// Image Scanner with dual functionality
async function scanImage() {
    if (!fileInput.files.length) {
        resultDiv.innerHTML = "<div class='error'>Please upload an image first.</div>";
        return;
    }

    resultDiv.innerHTML = "<div class='loading'>Processing image...</div>";
    
    try {
        // Try local processing first
        const localResponse = await processImageLocally();
        
        if (localResponse.text && localResponse.text.trim()) {
            showResult(localResponse.text, localResponse.source);
        } else {
            // Fallback to API
            const apiResponse = await processImageViaAPI();
            showResult(apiResponse.text, apiResponse.source);
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class='error'>Error: ${error.message}</div>`;
        console.error("Scan error:", error);
    }
}

async function processImageLocally() {
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    
    const response = await fetch('/scan-image', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('Server error');
    return response.json();
}

async function processImageViaAPI() {
    resultDiv.innerHTML = "<div class='loading'>Using enhanced scanning...</div>";
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('apikey', 'K81657832088957');
    formData.append('language', 'eng');
    
    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return {
        text: data.ParsedResults[0].ParsedText,
        source: 'OCR API'
    };
}

function showResult(text, source) {
    resultDiv.innerHTML = `
        <div class="success">
            <strong>Text recognized (${source}):</strong>
            <div class="text-output">${text || "No text found"}</div>
        </div>
    `;
}

// Health Chatbot with enhanced UI
async function askAI() {
    const question = queryInput.value.trim();
    if (!question) {
        responseDiv.innerHTML = "<div class='error'>Please enter a question.</div>";
        return;
    }

    responseDiv.innerHTML = "<div class='loading'>Consulting health advisor...</div>";
    
    try {
        const response = await fetch(`/ask-ai?question=${encodeURIComponent(question)}`);
        if (!response.ok) throw new Error('Server error');
        
        const data = await response.json();
        showResponse(data.response);
    } catch (error) {
        responseDiv.innerHTML = `<div class='error'>Error: ${error.message}</div>`;
        console.error("AI error:", error);
    }
}

function showResponse(message) {
    responseDiv.innerHTML = `
        <div class="success">
            <strong>Health Advisor:</strong>
            <div class="text-output">${message}</div>
        </div>
    `;
}

// Event Listeners
document.getElementById('userQuery').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') askAI();
});

// Utility to copy results to clipboard
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
        const text = e.target.parentElement.querySelector('.text-output').innerText;
        navigator.clipboard.writeText(text);
        e.target.textContent = 'Copied!';
        setTimeout(() => e.target.textContent = 'Copy', 2000);
    }
});

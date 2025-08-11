#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Simplified mock service for Adha AI Service
This mock simulates the Adha AI Service without database dependencies
"""

import os
import time
import json
from flask import Flask, request, jsonify

app = Flask(__name__)
port = int(os.environ.get("PORT", 8002))

# Simulate data storage
conversations = {}
documents = {}
prompts = {}
users = {
    "admin": {"username": "admin", "email": "admin@example.com", "role": "admin"}
}

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'ok',
        'service': 'adha-ai-service',
        'message': 'Adha AI Service mock is running',
        'timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'adha-ai-service',
        'timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

@app.route('/metrics', methods=['GET'])
def metrics():
    metrics_text = """# HELP adha_ai_status Service status
# TYPE adha_ai_status gauge
adha_ai_status{service="adha-ai-service"} 1
# HELP adha_ai_requests_total Total number of requests
# TYPE adha_ai_requests_total counter
adha_ai_requests_total{service="adha-ai-service"} 0"""
    return metrics_text, 200, {'Content-Type': 'text/plain'}

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    return jsonify({
        'id': f"chat_{int(time.time())}",
        'response': "This is a mock response from Adha AI Service.",
        'timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

@app.route('/api/conversations', methods=['GET'])
def list_conversations():
    return jsonify({
        'conversations': list(conversations.values()),
        'count': len(conversations)
    })

@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    if conversation_id in conversations:
        return jsonify(conversations[conversation_id])
    return jsonify({'error': 'Conversation not found'}), 404

@app.route('/api/documents', methods=['GET'])
def list_documents():
    return jsonify({
        'documents': list(documents.values()),
        'count': len(documents)
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    
    if username in users and password == 'password':  # Mock authentication
        return jsonify({
            'token': 'mock_jwt_token',
            'user': users[username]
        })
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/prompts', methods=['GET'])
def list_prompts():
    return jsonify({
        'prompts': list(prompts.values()),
        'count': len(prompts)
    })

@app.route('/api/journaling', methods=['POST'])
def create_journal():
    data = request.json
    journal_id = f"journal_{int(time.time())}"
    return jsonify({
        'id': journal_id,
        'content': data.get('content', ''),
        'created_at': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

if __name__ == '__main__':
    print(f"Starting Adha AI Service mock on port {port}")
    print("Available endpoints:")
    print("- GET / - Root endpoint")
    print("- GET /health - Health check endpoint")
    print("- GET /metrics - Metrics endpoint")
    print("- POST /api/chat - Chat endpoint")
    print("- GET /api/conversations - List conversations")
    print("- GET /api/conversations/<id> - Get conversation")
    print("- GET /api/documents - List documents")
    print("- POST /api/auth/login - Login endpoint")
    print("- GET /api/prompts - List prompts")
    print("- POST /api/journaling - Create journal entry")
    app.run(host='0.0.0.0', port=port)

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $message = $data['message'] ?? '';

    if (empty($message)) {
        echo json_encode(['error' => 'Message is required']);
        exit;
    }

    $apiKey = 'AIzaSyCip4Fsmoh7RPHXCXpnT-3BQ9QMtAelU20';
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

    // Prepare the prompt with context about civil engineering
    $prompt = "You are a Civil Engineering AI assistant. Please provide accurate, helpful, and detailed responses to questions about civil engineering. 
    Focus on topics like structural engineering, geotechnical engineering, transportation engineering, environmental engineering, construction management, and water resources.
    If the question is not related to civil engineering, politely inform the user that you specialize in civil engineering topics.
    
    User question: " . $message;

    $requestData = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.7,
            'topK' => 40,
            'topP' => 0.95,
            'maxOutputTokens' => 1024,
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
            echo json_encode([
                'response' => $responseData['candidates'][0]['content']['parts'][0]['text']
            ]);
        } else {
            echo json_encode(['error' => 'Invalid response format from Gemini API']);
        }
    } else {
        echo json_encode(['error' => 'Failed to get response from Gemini API. HTTP Code: ' . $httpCode]);
    }
} else {
    echo json_encode(['error' => 'Method not allowed']);
} 
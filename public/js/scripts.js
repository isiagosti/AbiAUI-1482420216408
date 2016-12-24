function home() {
    var r='';
    r+='<div class="btn-group btn-group-justified" role="group" aria-label="...">';
    r+='<div class="btn-group" role="group">';
    r+='<button type="button" class="btn btn-default" id="textToSpeechBtn">Text To Speech</button>';
    r+='</div>';
    r+='<div class="btn-group" role="group">';
    r+='<button type="button" class="btn btn-default" id="speechToTextBtn">Speech To Text</button>';
    r+='</div>';
    r+='<div class="btn-group" role="group">';
    r+='<button type="button" class="btn btn-default" id="conversationBtn">Conversation</button>';
    r+='</div>';
    r+='</div>';
    return r;
}

function textToSpeech() {
    var r='';
    r+='<button type="button" class="btn btn-default" id="btnHome">Back to homepage</button>';
    r+='<section>';
        r+='<h2>Basic Text to Speech Example</h2>';
        r+='<textarea id="text" rows="6" cols="80">Hello from IBM Watson</textarea><br>';
        r+='<button type="button" class="btn btn-default" id="buttonTTS">Synthesize Text</button>';
    r+='</section>';
    return r;
}

function speechToText() {
    var r='';
    return r;
}

function conversation() {
    var r='';
    return r;
}
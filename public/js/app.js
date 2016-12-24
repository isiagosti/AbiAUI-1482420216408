
$(document).ready(function() {
    
    // Load home main 
    var result = home();
    $("#main").html(result);
    window.location.hash = "home";
    
    $( "body" ).on( "click", "#btnHome", function(e){ 
        var result = home();
        $("#main").html(result);
        window.location.hash = "home";
        e.preventDefault();
    });
    
    $( "body" ).on( "click", "#textToSpeechBtn", function(e){ 
        var result = textToSpeech();
        $("#main").html(result);
        window.location.hash = "text_to_speech";
        e.preventDefault();
    });
    
    $( "body" ).on( "click", "#speechToTextBtn", function(e){ 
        var result = speechToText();
        $("#main").html(result);
        window.location.hash = "speech_to_text";
        e.preventDefault();
    });
    
    $( "body" ).on( "click", "#conversationBtn", function(e){ 
        var result = conversation();
        $("#main").html(result);
        window.location.hash = "conversation";
        e.preventDefault();
    });

    $( "body" ).on( "click", "#buttonTTS", function(e){ 
        fetch('api/text-to-speech/token')
            .then(function(response) {
                return response.text();
            }).then(function (token) {
            WatsonSpeech.TextToSpeech.synthesize({
                text: document.querySelector('#text').value,
                token: token,
                autoPlay: true
            });
        }); 
    }); 
});
                 
/*
function func() {
    var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
    var fs = require('fs');

    var text_to_speech = new TextToSpeechV1({
        password: "hDZTEqzIQ0gC",
        username: "24bee050-52ce-4b03-8d55-c4179134337a"
    });

    var params = {
        text: 'Hello from IBM Watson',
        voice: 'en-US_AllisonVoice', // Optional voice
        accept: 'audio/wav'
    };

    // Pipe the synthesized text to a file
    text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')); 
}
*/

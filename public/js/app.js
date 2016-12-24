/*
$(document).ready(function() {
    
    $( "body" ).on( "click", "#TextToSpeech", function(e){
        alert('ok');
        var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
        var fs = require('fs');

        var text_to_speech = new TextToSpeechV1({
            username: 'd8290229-49cb-400b-a416-14dab109bf5f',
            password: 'sr8QKLnyFlpw'
        });

        var params = {
            text: 'Hello from IBM Watson',
            voice: 'en-US_AllisonVoice', // Optional voice
            accept: 'audio/wav'
        };

        // Pipe the synthesized text to a file
        text_to_speech.synthesize(params).pipe(fs.createWriteStream('output.wav')); 
    });
}
                  */

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
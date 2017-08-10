(function() {
    "use strict";

    var ENTER_KEY_CODE = 13;
    var TALK_MSG = 'Speak now';
    var clientName = 'Isabella';
    var WELCOME_PHRASE = 'Ciao ' + clientName + '! Mi chiamo ABI. Puoi chiedermi di leggerti un libro o le ultime notizie. Come posso aiutarti?';
    var FINISHED_BOOK_PHRASE = 'Ho finito di leggere il libro. Posso fare qualcos\'altro per te?';
    var READ_FROM_BEGINNING_PHRASE = 'Va bene. Ricomincio da capo allora.';
    var READ_FROM_BOOKMARK_PHRASE = 'Va bene. Ricomincio da dove ci eravamo fermati.';
    var ALREADY_STARTED_BOOK_PHRASE = 'Abbiamo già iniziato questo libro. Vuoi ricominciare da dove ci siamo fermati?';
    var READING_PHRASE = 'Ok! Inizio a leggere';
    
    var queryInput, resultDiv, micBtn, timeout, isSentence;
    var recognition = new webkitSpeechRecognition();
    var recognizing = false;
    var speaking = false;
    var prefix = '';
    var finalTranscript = '';
    var oldPlaceholder = null;
    var defaultPatienceThreshold = 2;
    var patience, queryNode, reader; 
    var speech = window.speechSynthesis;
    var currentLine = [{'id':'Harry Potter', 'line':0},{'id': 'Il Signore degli Anelli', 'line':0}]; // Line ABI has to start reading from next time the book is requested, for each book.
    var bookmark = false;
    var bookToRead = ['', 0];

    window.onload = init;

    function init() {
        queryInput = document.getElementById("q");
        resultDiv = document.getElementById("result");
        micBtn = document.getElementById('mic');
      
        micBtn.addEventListener('click', speakButton, false);
        queryInput.addEventListener("keydown", queryInputKeyDown);
        patience = parseInt(queryInput.dataset.patience, 10) || defaultPatienceThreshold;
        document.getElementById("main-wrapper").style.display = "block";
        window.init();
        var welcomeNode = createResponseNode();
        readSimpleNode(welcomeNode, WELCOME_PHRASE);
    }
    
    function readSimpleNode(node, result) {
        node.innerHTML = result;

        function speakNode() {
            if (speaking) {
                return;
            }
            speaking = true;
            var msg = new SpeechSynthesisUtterance(result);
            Promise.resolve(speech.speak(msg))
            .then(function () {speaking = false;})
            .catch(function (err) {
              speaking = false;
              Materialize.toast(err, 2000, 'red lighten-1');
            });
        }

        node.addEventListener("click", speakNode);
        speakNode();
    }
    
    function readFile(file) {
        reader = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
        reader.open('get', file, true); 
        reader.onreadystatechange = saveBookInList;
        reader.send(null);
        speaking = false;
    }

    function saveBookInList() {
        if(reader.readyState == 4) {
            //tts(reader.responseText);
            
            var lines = reader.responseText.split('. ');
            readBook(lines, currentLine[bookToRead[1]].line);
            
            /*
            var msg;
            var lines = reader.responseText.split('. ');
            
            for(var line = 0; line < lines.length; line++){
                console.log('(' + line + ')\n' + lines[line]);
                msg = new SpeechSynthesisUtterance(lines[line]);
                speaking = true;
                speech.speak(msg);
                msg.onend = function(event) {
                    alert('ok');
                    console.log('Utterance has finished being spoken after ' + event.elapsedTime + ' milliseconds.');
                };
            }
            */
            
            /*
            var msg = new SpeechSynthesisUtterance(reader.responseText);
            speaking = true;
            speech.speak(msg);
            */
        }
    }
    
    function readBook(text, index) {
        console.log('(' + index + ')\n' + text[index]);
        var msg = new SpeechSynthesisUtterance(text[index]);
        speaking = true;
        speech.speak(msg);
        msg.onend = function(event) {
            if(speaking) {
                speaking = false;
                if(index < text.length - 1) {
                    // Read the next phrase.
                    index ++;
                    readBook(text, index);
                } else {
                    // ABI has finished reading the book.
                    currentLine[bookToRead[1]].line = 0;
                    bookToRead = ['', 0];
                    var responseNode = createResponseNode();
                    readSimpleNode(responseNode, FINISHED_BOOK_PHRASE);
                }
            } else {
                // The user wants ABI to stop reading. --> Save the current line for bookmark.
                currentLine[bookToRead[1]].line = index;
                console.log(currentLine);
            }
        };
    }
    
    function speakButton() {
        event.preventDefault();
        
        // stop the reading if the user says something
        if(speaking) {
            speaking = false;
            speech.cancel();
        }
        
        // stop user's recognition if already going
        if (recognizing) {
            recognition.stop();
            return;
        } else {
            recognition.continuous = true;
            recognition.interimResults = true;
            queryNode = createQueryNode('...');
        }

        // Cache current input value which the new transcript will be appended to
        var endsWithWhitespace = queryInput.value.slice(-1).match(/\s/);
        prefix = !queryInput.value || endsWithWhitespace ? queryInput.value : queryInput.value + ' ';

        // check if value ends with a sentence
        isSentence = prefix.trim().slice(-1).match(/[\.\?\!]/);

        // restart recognition
        finalTranscript = '';
        recognition.start();
    }

    function queryInputKeyDown(event) {
        if (event.which !== ENTER_KEY_CODE) {
            return;
        }

        var value = queryInput.value;
        recognition.stop();
        queryInput.value = "";

        createQueryNode(value);
        makeQuery(value);
    }
    
    function setQueryOnNodeFromMic(query, node) {
        node.innerHTML = query ? query : "[empty query]";
        makeQuery(query);
    }
    
    function makeQuery(queryValue) {
        var responseNode = createResponseNode();

        if(bookmark) {
            bookmark = false;
            if(queryValue.includes('No')) {
                currentLine[bookToRead[1]].line = 0; 
                readSimpleNode(responseNode, READ_FROM_BEGINNING_PHRASE);
            } else {
                readSimpleNode(responseNode, READ_FROM_BOOKMARK_PHRASE);
            }
            readFile('./books/' + bookToRead[0] + '.txt');
        } else {
            sendText(queryValue)
              .then(function(response) {
                var result;
                try {
                  result = response.result.fulfillment.speech
                } catch(error) {
                  result = "";
                }

                if(result.includes(READING_PHRASE)) {
                    bookToRead[0] = response.result.parameters.libro;
                    for(var i=0; i<currentLine.length; i++) {
                        if(currentLine[i].id == bookToRead[0]) {
                            bookToRead[1] = i;
                            break;
                        }
                    }
                }
                
                if(result.includes(READING_PHRASE) && currentLine[bookToRead[1]].line != 0) {
                    bookmark = true;
                    readSimpleNode(responseNode, ALREADY_STARTED_BOOK_PHRASE);
                } else {
                    setResponseJSON(response);
                    setResponseOnNode(response, result, responseNode);
                }
              })
              .catch(function(err) {
                setResponseJSON(err);
                setResponseOnNode("Something went wrong", responseNode);
              });
        }
    }

    function createQueryNode(query) {
        var node = document.createElement('div');
        node.className = "clearfix left-align left card-panel green accent-1";
        node.innerHTML = query;
        resultDiv.appendChild(node);
        node.scrollIntoView();
        return node;
    }
    
    function createResponseNode() {
        var node = document.createElement('div');
        node.className = "clearfix right-align right card-panel blue-text text-darken-2 hoverable";
        node.innerHTML = "...";
        resultDiv.appendChild(node);
        node.scrollIntoView();
        return node;
    }

    function setResponseOnNode(response, result, node) {
        node.innerHTML = result ? result : "[empty response]";
        node.setAttribute('data-actual-response', result);

        function speakNode() {
            if (!result || speaking) {
                return;
            }
            speaking = true;
            var msg = new SpeechSynthesisUtterance(result);
            Promise.resolve(speech.speak(msg))
            .then(function () {speaking = false; checkContext(response);})
            .catch(function (err) {
              speaking = false;
              Materialize.toast(err, 2000, 'red lighten-1');
            });

          /*
            tts(result)
            .then(function () {speaking = false; checkContext(response);})
            .catch(function (err) {
              speaking = false;
              Materialize.toast(err, 2000, 'red lighten-1');
            });
            */
        }

        node.addEventListener("click", speakNode);
        speakNode();
    }
    
    function checkContext(response) {
        if((response.result.contexts.length > 0) && (response.result.fulfillment.speech.includes(READING_PHRASE))) {
           //&& (response.result.action == 'leggendo-libro') && (response.result.contexts[0].name == 'leggi-libro')) {
            readFile('./books/' + bookToRead[0] + '.txt');
        }
    }

    function setResponseJSON(response) {
        var node = document.getElementById("jsonResponse");
        node.innerHTML = JSON.stringify(response, null, 2);
    }
    
    function restartTimer(queryValue) {
        timeout = setTimeout(function() {
            setQueryOnNodeFromMic(queryValue, queryNode);
            recognition.stop();
        }, patience * 1000);
    }
    
    function capitalize(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
    
    recognition.onstart = function() {
        oldPlaceholder = queryInput.placeholder;
        queryInput.placeholder = queryInput.dataset.ready || TALK_MSG;
        recognizing = true;
        micBtn.classList.add('listening');
        restartTimer();
    };

    recognition.onend = function() {
			recognizing = false;
			clearTimeout(timeout);
			micBtn.classList.remove('listening');
            queryInput.value = '';
			if (oldPlaceholder !== null) queryInput.placeholder = oldPlaceholder;
		};
        
    recognition.onresult = function(event) {
			clearTimeout(timeout);

			// get SpeechRecognitionResultList object
			var resultList = event.results;

			// go through each SpeechRecognitionResult object in the list
			var interimTranscript = '';
			for (var i = event.resultIndex; i < resultList.length; ++i) {
				var result = resultList[i];

				// get this result's first SpeechRecognitionAlternative object
				var firstAlternative = result[0];

				if (result.isFinal) {
					finalTranscript += firstAlternative.transcript;
				} else {
					interimTranscript += firstAlternative.transcript;
				}
			}

			// capitalize transcript if start of new sentence
			var transcript = finalTranscript || interimTranscript;
			transcript = !prefix || isSentence ? capitalize(transcript) : transcript;

			// append transcript to cached input value
			queryInput.value = prefix + transcript;
/*
			// set cursur and scroll to end
			queryInput.focus();
			if (queryInput.tagName === 'INPUT') {
				queryInput.scrollLeft = queryInput.scrollWidth;
			} else {
				queryInput.scrollTop = queryInput.scrollHeight;
			}
*/     
			restartTimer(queryInput.value);
		};

})();

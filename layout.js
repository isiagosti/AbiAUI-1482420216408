(function() {
    "use strict";

    var ENTER_KEY_CODE = 13;
    var TALK_MSG, WELCOME_PHRASE, FINISHED_BOOK_PHRASE, FINISHED_NEWS_PHRASE, READ_FROM_BEGINNING_PHRASE, READ_FROM_BOOKMARK_PHRASE, ALREADY_STARTED_BOOK_PHRASE, READING_PHRASE, BOOK_NOT_FOUND_PHRASE, NON_STOP_PHRASE, LATEST_NEWS_PHRASE, BOOKS_PATH, NEWS_FEED, VOICE_CHANGED_PHRASE;
    
    var queryInput, resultDiv, micBtn, timeout, isSentence, voices, chosenVoice;
    var count = 0;
    var conversationStart = true;
    var recognition = new webkitSpeechRecognition();
    var speech = window.speechSynthesis;
    var recognizing = false;
    var speaking = false;
    var prefix = '';
    var finalTranscript = '';
    var oldPlaceholder = null;
    var defaultPatienceThreshold = 2;
    var patience, queryNode, reader; 
    var currentLine; // Line ABI has to start reading from next time the book is requested, for each book.
    var bookmark = false;
    var bookToRead = {'title':'', 'author':'', 'index':0};

    window.onload = init;

    function init() {
        queryInput = document.getElementById("q");
        resultDiv = document.getElementById("result");
        micBtn = document.getElementById('mic');
        var itaBtn = document.getElementById("ita");
        var engBtn = document.getElementById("eng");
      
        micBtn.addEventListener('click', speakButton, false);
        //itaBtn.addEventListener('click', setItalian, false);
        //engBtn.addEventListener('click', setEnglish, false);
        queryInput.addEventListener("keydown", queryInputKeyDown);
        patience = parseInt(queryInput.dataset.patience, 10) || defaultPatienceThreshold;
    }
    
    window.speechSynthesis.onvoiceschanged = function() {
        if(count == 0) {
            voices = speech.getVoices();

            $('select').material_select();
            var options = [0, 2, 8, 49, 1, 32];

            for(var i = 0; i < options.length ; i++) {
                var j = options[i];
                var value = voices[j].name + ' (' + voices[j].lang + ')';

                // And add a new value
                if(j==0 || j==2) {
                    $("select").append($("<option></option>").attr("value", j).attr("data-icon", "./img/Italia.png").attr("class", "circle").text(value));
                } else if(j==8 || j==49) {
                    $("select").append($("<option></option>").attr("value", j).attr("data-icon", "./img/UK.jpg").attr("class", "circle").text(value));
                } else {
                    $("select").append($("<option></option>").attr("value", j).attr("data-icon", "./img/US.png").attr("class", "circle").text(value));
                }

                // Update the content 
                $("select").material_select();
            }
            
            count++;
        }
    };
    
    $('select').on('change',function() {
        chosenVoice = $(this).val();

        if(chosenVoice == 0 || chosenVoice == 2) {
            setItalian();
        } else {
            setEnglish();
        }
    });
    
    function setItalian() {
        TALK_MSG = 'Parla ora';
        WELCOME_PHRASE = 'Ciao! Mi chiamo ABI. Puoi chiedermi di leggerti un libro o le ultime notizie. Come posso aiutarti?';
        FINISHED_BOOK_PHRASE = 'Ho finito di leggere il libro. Posso fare qualcos\'altro per te?';
        FINISHED_NEWS_PHRASE = 'Ho finito di leggere tutte le notizie. Posso fare qualcos\'altro per te?';
        READ_FROM_BEGINNING_PHRASE = 'Va bene. Ricomincio da capo allora.';
        READ_FROM_BOOKMARK_PHRASE = 'Va bene. Ricomincio da dove ci eravamo fermati.';
        ALREADY_STARTED_BOOK_PHRASE = 'Abbiamo già iniziato questo libro. Vuoi ricominciare da dove ci siamo fermati?';
        READING_PHRASE = 'Ok! Inizio a leggere';
        BOOK_NOT_FOUND_PHRASE = 'Non riesco a trovare il libro richiesto. Posso fare qualcos\'altro per te?';
        NON_STOP_PHRASE = 'Ok! Continuo a leggere allora.';
        LATEST_NEWS_PHRASE = 'Ok! Ti leggo subito le ultime notizie.';
        VOICE_CHANGED_PHRASE = 'Ho cambiato la mia voce. Cosa posso fare per te?';
        BOOKS_PATH = 'booksIta';
        NEWS_FEED = "https://news.google.com/news/rss/headlines?hl=it&ned=it";
        currentLine = [{'id':'Harry Potter, J. K. Rowling', 'line':0},{'id': 'Il Signore degli Anelli, J. R. R. Tolkien', 'line':0}];
        
        startConversation('55292ddbe3fe49019f4743d0e39de6cb');
    }
    
    function setEnglish() {
        TALK_MSG = 'Speak now';
        WELCOME_PHRASE = 'Hello, my name is ABI! You can say things like «read me a book» or «read me the latest news». How can I help you?';
        FINISHED_BOOK_PHRASE = 'I\'m finished reading the book. Can I do anything else for you?';
        FINISHED_NEWS_PHRASE = 'I\'m finished reading all the news. Can I do anything else for you?';
        READ_FROM_BEGINNING_PHRASE = 'Ok. I\'ll start from the beginning then.';
        READ_FROM_BOOKMARK_PHRASE = 'Ok. I\'ll start from where we left last time then.';
        ALREADY_STARTED_BOOK_PHRASE = 'We already started reading this book. Do you want to resume from where we left?';
        READING_PHRASE = 'Ok! I\'ll start reading';
        BOOK_NOT_FOUND_PHRASE = 'I can\'t seem to find the book. Can I do anything else for you?';
        NON_STOP_PHRASE = 'Ok! I\'ll keep reading then.';
        LATEST_NEWS_PHRASE = 'Great! I\'ll start reading';
        VOICE_CHANGED_PHRASE = 'I\'ve changed my voice. What can I do for you?';
        BOOKS_PATH = 'booksEng';
        currentLine = [{'id':'Harry Potter, J. K. Rowling', 'line':0},{'id': 'The Lord of the Rings, J. R. R. Tolkien', 'line':0}];
        queryInput.placeholder = "Ask me something...";
        
        if(chosenVoice == 1 || chosenVoice == 32) {
            // US
            NEWS_FEED = "https://news.google.com/news/rss/headlines?ned=us&hl=en";
            recognition.lang = "en-US";
        } else if(chosenVoice == 8 || chosenVoice == 49) {
            //UK
            NEWS_FEED = "https://news.google.com/news/rss/headlines?ned=uk&hl=en-GB";
            recognition.lang = "en-UK";
        }
        
        startConversation('6cdd59eb028c4db1bfd3f73d108368e5');
    }
    
    function startConversation(token) {
        document.getElementById("main-wrapper").style.display = "block";
        window.init(token);
        var welcomeNode = createResponseNode();
        if(conversationStart) {
            conversationStart = false;
            readSimpleNode(welcomeNode, WELCOME_PHRASE);
        } else {
            readSimpleNode(welcomeNode, VOICE_CHANGED_PHRASE);
        }
    }
    
    function readSimpleNode(node, result) {
        node.innerHTML = result;

        function speakNode() {
            if (speaking) {
                return;
            }
            speaking = true;
            var msg = new SpeechSynthesisUtterance(result);
            msg.voice = voices[chosenVoice];
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
            readBook(lines, currentLine[bookToRead.index].line);
            
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
        msg.voice = voices[chosenVoice];
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
                    currentLine[bookToRead.index].line = 0;
                    bookToRead.title = '';
                    bookToRead.author = '';
                    bookToRead.index = 0;
                    var responseNode = createResponseNode();
                    readSimpleNode(responseNode, FINISHED_BOOK_PHRASE);
                }
            } else {
                // The user wants ABI to stop reading. --> Save the current line for bookmark.
                currentLine[bookToRead.index].line = index;
            }
        };
    }
    
    function readNews(text, index) {
        console.log('(' + index + ')\n' + text[index].title);
        var msg = new SpeechSynthesisUtterance(text[index].title);
        msg.voice = voices[chosenVoice];
        speaking = true;
        speech.speak(msg);
        msg.onend = function(event) {
            if(speaking) {
                speaking = false;
                if(index < text.length - 1) {
                    // Read the next title.
                    index ++;
                    readNews(text, index);
                } else {
                    // ABI has finished reading all the news.
                    var responseNode = createResponseNode();
                    readSimpleNode(responseNode, FINISHED_NEWS_PHRASE);
                }
            }
        };
    }
    
    function speakButton() {
        event.preventDefault();
        micBtn.className = 'btn-floating waves-effect waves-light red';
        
        // stop the reading if the user says something
        if(speaking) {
            speaking = false;
            speech.cancel();
        }
        
        // stop user's recognition if already going
        if (recognizing) {
            micBtn.className = 'btn-floating waves-effect waves-light blue';
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
                currentLine[bookToRead.index].line = 0; 
                readSimpleNode(responseNode, READ_FROM_BEGINNING_PHRASE);
            } else {
                readSimpleNode(responseNode, READ_FROM_BOOKMARK_PHRASE);
            }
            readFile('./' + BOOKS_PATH + '/' + bookToRead.title + ', ' + bookToRead.author + '.txt');
        } else {
            sendText(queryValue)
              .then(function(response) {
                var result;
                try {
                  result = response.result.fulfillment.speech;
                } catch(error) {
                  result = "";
                }

                var found = false;
                var goInElse = true;
                
                if(result.includes(READING_PHRASE)) {
                    bookToRead.title = response.result.parameters.libro;
                    bookToRead.author = response.result.parameters.autore;
                    for(var i=0; i<currentLine.length; i++) {
                        if(currentLine[i].id == (bookToRead.title + ', ' + bookToRead.author)) {
                            bookToRead.index = i;
                            found = true;
                            break;
                        }
                    }
                    if(!found) {
                        goInElse = false;
                        readSimpleNode(responseNode, BOOK_NOT_FOUND_PHRASE);
                    }
                } else if(result.includes(NON_STOP_PHRASE)) {
                    readFile('./' + BOOKS_PATH + '/' + bookToRead.title + ', ' + bookToRead.author + '.txt');
                } else if(result.includes(LATEST_NEWS_PHRASE)) {
                    google.load("feeds", "1");

                    function initializeFeed() {
                      var feed = new google.feeds.Feed(NEWS_FEED);
                      feed.load(function(result) {
                        if (!result.error) {
                            readNews(result.feed.entries, 0);
                        }
                      });
                    }
                    
                    google.setOnLoadCallback(initializeFeed);
                }
                
                if(found && currentLine[bookToRead.index].line != 0) {
                    goInElse = false;
                    bookmark = true;
                    readSimpleNode(responseNode, ALREADY_STARTED_BOOK_PHRASE);
                } else if (goInElse){
                    //setResponseJSON(response);
                    setResponseOnNode(response, result, responseNode);
                }
              })
              .catch(function(err) {
                //setResponseJSON(err);
                setResponseOnNode("Something went wrong", responseNode);
              });
        }
    }

    function createQueryNode(query) {
        var node = document.createElement('div');
        node.className = "clearfix left-align left card-panel teal accent-4 white-text";
        node.innerHTML = query;
        resultDiv.appendChild(node);
        node.scrollIntoView();
        return node;
    }
    
    function createResponseNode() {
        var node = document.createElement('div');
        node.className = "clearfix right-align right card-panel teal-text text-lighten-1 hoverable";
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
            msg.voice = voices[chosenVoice];
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
        if(response.result.fulfillment.speech.includes(READING_PHRASE)) {
            readFile('./' + BOOKS_PATH + '/' + bookToRead.title + ', ' + bookToRead.author + '.txt');
        }
    }

    function setResponseJSON(response) {
        var node = document.getElementById("jsonResponse");
        node.innerHTML = JSON.stringify(response, null, 2);
    }
    
    function restartTimer(queryValue) {
        timeout = setTimeout(function() {
            micBtn.className = 'btn-floating waves-effect waves-light blue';
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
        if (oldPlaceholder !== null) 
            queryInput.placeholder = oldPlaceholder;
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

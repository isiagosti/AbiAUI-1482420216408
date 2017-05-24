(function() {
    "use strict";

    var ENTER_KEY_CODE = 13;
    var queryInput, resultDiv, micBtn, timeout, isSentence;
    var recognition = new webkitSpeechRecognition();
    var recognizing = false;
    var prefix = '';
    var finalTranscript = '';
    var oldPlaceholder = null;
    var talkMsg = 'Speak now';
    var defaultPatienceThreshold = 2;
    var patience, queryNode, reader; 

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
    }
    
    function readFile(file) {
        reader = new XMLHttpRequest() || new ActiveXObject('MSXML2.XMLHTTP');
        reader.open('get', file, true); 
        reader.onreadystatechange = displayContents;
        reader.send(null);
    }

    function displayContents() {
        if(reader.readyState == 4) {
            console.log(reader.responseText);
            tts(reader.responseText);
        }
    }
    
    function speakButton() {
        event.preventDefault();

        // stop and exit if already going
        if (recognizing) {
            recognition.stop();
            return;
        } else {
            recognition.continuous = true;
            recognition.interimResults = true;
            queryNode = createQueryNodeFromMic();
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
      var responseNode = createResponseNode();

    sendText(value)
      .then(function(response) {
        var result;
        try {
          result = response.result.fulfillment.speech
        } catch(error) {
          result = "";
        }
        setResponseJSON(response);
        setResponseOnNode(response, result, responseNode);
      })
      .catch(function(err) {
        setResponseJSON(err);
        setResponseOnNode("Something went wrong", responseNode);
      });
  }

    function createQueryNode(query) {
    var node = document.createElement('div');
    node.className = "clearfix left-align left card-panel green accent-1";
    node.innerHTML = query;
    resultDiv.appendChild(node);
  }
    
    function createQueryNodeFromMic() {
        var node = document.createElement('div');
        node.className = "clearfix left-align left card-panel green accent-1";
        node.innerHTML = "...";
        resultDiv.appendChild(node);
        return node;
    }
    
    function setQueryOnNodeFromMic(query, node) {
        node.innerHTML = query ? query : "[empty query]";
        var responseNode = createResponseNode();

        sendText(query)
          .then(function(response) {
            var result;
            try {
              result = response.result.fulfillment.speech
            } catch(error) {
              result = "";
            }
            setResponseJSON(response);
            setResponseOnNode(response, result, responseNode);
          })
          .catch(function(err) {
            setResponseJSON(err);
            setResponseOnNode("Something went wrong", responseNode);
          });
  }

    function createResponseNode() {
    var node = document.createElement('div');
    node.className = "clearfix right-align right card-panel blue-text text-darken-2 hoverable";
    node.innerHTML = "...";
    resultDiv.appendChild(node);
    return node;
  }

    function setResponseOnNode(response, result, node) {
        node.innerHTML = result ? result : "[empty response]";
        node.setAttribute('data-actual-response', result);
        var speaking = false;

        function speakNode() {
          if (!result || speaking) {
            return;
          }
          speaking = true;
          tts(result)
            .then(function () {speaking = false; checkContext(response);})
            .catch(function (err) {
              speaking = false;
              Materialize.toast(err, 2000, 'red lighten-1');
            });
        }

        node.addEventListener("click", speakNode);
        speakNode();
    }
    
    function checkContext(response) {
        if((response.result.contexts.length > 0) && (response.result.contexts[0].name == 'leggi-libro')) {
            console.log('Inizio a leggere');
            readFile('./libri/' + response.result.parameters.libro + '.txt');
        }
    }

    function setResponseJSON(response) {
        var node = document.getElementById("jsonResponse");
        node.innerHTML = JSON.stringify(response, null, 2);
    }

    function sendRequest() {

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
        oldPlaceholder = queryInput.placeholder; //oldPlaceholder = "Tell me something..."
        queryInput.placeholder = queryInput.dataset.ready || talkMsg;
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

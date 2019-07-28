var app = angular.module("verbal-coding", []);

app.directive('myEnter', function () {
    return function ($scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
        	switch (event.which) {
            	case 70:
            		$scope.toggleRecording();
          			break;
				case 74: // TODO find correct key
					console.log("clicked compile");
					$scope.compile();
					/*var inputCode = "";
					for (var workflowStep of document.getElementById("workflowTable").children) {
						var statementPlus = workflowStep.innerHTML.split("content\">");
						var statementSplit = statementPlus[1].split("</div>");
						var statementRel = statementSplit[0];
						inputCode += statementRel + ";";
					}
					inputCode = inputCode.substring(0, inputCode.length - 1);
					var outputHtml = compiler(inputCode);*/

					//$scope.addProject();
					break;
        	}
        });
    };
});

app.config(function($sceDelegateProvider) { // TODO do we need this or not???? *********************************************
	$sceDelegateProvider.resourceUrlWhitelist([
        'self', // trust all resources from the same origin
        '*://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/**'   // trust all resources from `www.youtube.com`
    ]);
});

var mainController = app.controller("MainController", ['$scope', function ($scope) {
	$scope.keywords = ["define variable", "add", "subtract", "multiply", "divide", "modulus", "if", "for", "while"];
	$scope.projects = [];
	$scope.currentlyTalking = false;
	$scope.currentlyRecording = false;
	$scope.currStep = 1;
	$scope.workflow = [];
	$scope.currCodeBlock = 0;
	$scope.codeBlocks = [{type: "normal"}]; // {type: "normal", type: "if OR while OR do-while OR for"}
	$scope.codeIsInProject = false;

	//makeCorsRequest("declare variable integer apple$$input user integer to variable tree$$declare variable integer apple equal to tree$$output variable tree");
	//makeCorsRequest("output text hello world");
	//makeCorsRequest("output text jeeva is sped");

	// Sets default voice
	var speech_voices;
	if ('speechSynthesis' in window) {
		speech_voices = window.speechSynthesis.getVoices();
		window.speechSynthesis.onvoiceschanged = function() {
	    	speech_voices = window.speechSynthesis.getVoices();
	  	};
	}

	var speak = function(text, callback = function() { $scope.currentlyTalking = false; }) {
		console.log("currently talking: " + $scope.currentlyTalking);
		if ($scope.currentlyTalking) return;

    	var message = new SpeechSynthesisUtterance();
    	var voices = window.speechSynthesis.getVoices();
    	message.voice = voices[48];
    	message.rate = 1;
    	message.pitch = 1;
    	message.text = text;

    	$scope.currentlyTalking = true;
    	speechSynthesis.speak(message);

    	message.onstart = function() {
    		console.log("Started speaking");
    		$('#bars').fadeIn("slow");
    		$('#bars2').fadeOut("fast");
    	};
    	message.onend = function () {
    		console.log("Ended speaking");
    		$('#bars').fadeOut("slow");
    		$('#bars2').fadeIn("fast");
    		callback();
		};
    };

    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    var finalTranscript = '';
    let recognition = new window.SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (event) => {
		let interimTranscript = '';
		for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
	        var transcript = event.results[i][0].transcript;
	        if (event.results[i].isFinal) {
	        	finalTranscript += transcript;
	        }
	        else {
	        	interimTranscript += transcript;
	        }
		}
		document.querySelector('#interimText').innerHTML = finalTranscript + '<i>' + interimTranscript + '</>';
    };

    var addToWorkflow = function (obj) {
    	obj.codeBlock = $scope.currCodeBlock;
    	$scope.workflow.push(obj);
    	var letter;
    	switch (obj.type) {
    		case "Command": letter = "S"; break;
    		case "While loop": letter = "W"; break;
    		case "For loop counter": letter = "FI"; break; // for loop iterator
			case "For loop conditional": letter = "FC"; break;
			case "For loop operator": letter = "FO"; break;
    	}
    	var _class;
    	switch ($scope.codeBlocks[$scope.currCodeBlock].type) {
    		case "normal": _class = "purple"; break;
    		case "while": _class = "yellow"; break;
    		default: _class = "purple"; break;
    	}
    	document.querySelector('#workflowTable').innerHTML += "<div class='workflowStep " + _class +  "' data-workflowid='" + obj.id + "'><div class='type'>" + letter + "</div><div class='content'>" + obj.content + "</div><div class='delete'>&#215;</div></div>";
    	$('.delete').on('click', function () {
			var id = $(this).parent().attr("data-workflowid");
			$(this).parent().remove();
			for (var i=0; i<$scope.workflow.length; i++) {
				if ($scope.workflow[i].id === id) {
					$scope.workflow.splice(i, 1);
				}
			}
		});
    };

    $scope.compile = function() {
		if (!$scope.codeIsInProject) {
			speak("What would you like to call this project?", function() {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					debugger;
					$scope.currentlyTalking = false;
					var projName = titleCase(finalTranscript.trim());
					document.getElementById('currProjNameInput').value = projName;
					// Parse code (TODO do for/while loops)
					var codeToSend = "";
					var codeToSendNodes = document.getElementById("workflowTable").childNodes;
					for (var node of codeToSendNodes) {
						var nodeParts = node.childNodes;
						for (var nodePart of nodeParts) {
							if (nodePart.classList.contains("content")) {
								codeToSend += nodePart.innerHTML + "$$";
							}
						}
					}
					codeToSend = codeToSend.substring(0, codeToSend.length - 3);

					/*for (var i=0; i<$scope.workflow.length; i++) {
						codeToSend += $scope.workflow[i].content;
						if (i !== $scope.workflow.length - 1) codeToSend += "$$";
					}*/
					document.getElementById('currWorkflowInput').value = codeToSend;
					console.log(codeToSend);
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
					finalTranscript = "";
				};
			});
		}
	};

    $scope.addProject = function() {

	};
    
    $scope.toggleRecording = function() {
		if ($scope.currStep === 1) {
			$scope.currentlyTalking = false;
			speak("Say a statement.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					//document.getElementById("workflowMem").value += finalTranscript.trim().toLowerCase() + "$$";
					//console.log();
					//makeCorsRequest(finalTranscript.trim().toLowerCase());

					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "Command",
						content: finalTranscript.trim().toLowerCase(),
						id: new Date().getTime()
					});
					document.getElementById("workflowMem").value += finalTranscript.trim().toLowerCase() + "$$";
					var codeToSend = "";
					var codeToSendParts = document.getElementById("workflowTable").childNodes;
					for (var node of codeToSendParts) {
						var childNodes = node.childNodes;
						for (var childNode of childNodes) {
							if (childNode.classList.contains("content")) {
								codeToSend += childNode.innerHTML + "$$";
							}
						}
					}
					makeCorsRequest(codeToSend.substring(0, codeToSend.length - 2));
					console.log(codeToSend);

					var str = $scope.workflow[$scope.workflow.length-1].content;
					if (str.indexOf("start") !== -1 && str.indexOf("while") !== -1) {
						console.log("start while"); // TODO ADD SUPPORT FOR DO-WHILE LOOPS BY ASKING FOR CONDITION TO BE PRE OR POST
						$scope.currStep = 4;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "while"});
						speak("Okay, I am processing your request. Press F to continue.");
					}
					else if (str.indexOf("start") !== -1 && (str.indexOf("for") !== -1 || str.indexOf("four") !== -1 || str.indexOf("4") !== -1)) {
						console.log("start for");
						$scope.currStep = 5;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "for"});
						speak("Okay, I am processing your request. Press F to continue.");
					}
					else if (str.indexOf("stop") !== -1 && (str.indexOf("for") !== -1 || str.indexOf("four") !== -1 || str.indexOf("4") !== -1)) {
						console.log("stop for");
						$scope.currStep = 1;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "normal"});
						speak("Okay, I have ended your for loop. Press F to continue.");
					}
					else if (str.indexOf("stop") !== -1 && str.indexOf("while") !== -1) {
						console.log("stop while");
						$scope.currStep = 1;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "normal"});
						speak("Okay, I have ended your while loop. Press F to continue.");
					}
					else {
						$scope.currStep = 1;
						speak("Okay, I am processing your request. Press F to continue.");
					}
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
					finalTranscript = "";
		        };
			});
		}
		else if ($scope.currStep === 3) {
			$scope.currentlyTalking = false;
			speak("Okay, say your statement.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "Statement",
						content: finalTranscript.trim().toLowerCase()
					});
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
					
			        speak("I am converting your command into code.", function () {
			        	$scope.currentlyTalking = false;
			        });
					$http({
						method: "GET",
						url: "http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=" + encodeURIComponent(finalTranscript.trim().toLowerCase()),
						dataType: 'json',
						headers: {'Authorization': 'Token token=xxxxYYYYZzzz'}
					}).then(function mySuccess(response) {
					    console.log(response);
					  }, function myError(response) {
					    console.log(response);
					  });
			        finalTranscript = "";
		        };
			});
			$scope.currStep = 1;
		}
		else if ($scope.currStep === 4) {
			$scope.currentlyTalking = false;
			speak("What is the conditional for your while loop?", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "While loop",
						content: finalTranscript.trim().toLowerCase()
					});
					$scope.currStep = 1;
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
			        speak("Okay, you can now start saying the commands for your while loop. Press F to continue.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
		else if ($scope.currStep === 5) {
			$scope.currentlyTalking = false;
			speak("Declare a counter for your for loop.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "For loop counter",
						content: finalTranscript.trim().toLowerCase()
					});
					$scope.currStep = 6;
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
			        speak("Press F to continue.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
		else if ($scope.currStep === 6) {
			$scope.currentlyTalking = false;
			speak("Declare your conditional for the for loop.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "For loop conditional",
						content: finalTranscript.trim().toLowerCase()
					});
					$scope.currStep = 7;
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
			        speak("Press F to continue.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
		else if ($scope.currStep === 7) {
			$scope.currentlyTalking = false;
			speak("Declare a command to modify the counter at the end of each iteration.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "For loop operation",
						content: finalTranscript.trim().toLowerCase()
					});
					$scope.currStep = 1;
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
			        speak("Press F to start saying the commands of your for loop. Say 'stop for' to end the for loop.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
    };
}]);

function titleCase(str) {
	var splitStr = str.toLowerCase().split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		// You do not need to check if i is larger than splitStr length, as your for does that for you
		// Assign it back to the array
		splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	}
	// Directly return the joined string
	return splitStr.join(' ');
}

function compiler(code) {
	var output = "";
	var memory = {};

	var statements = code.split(";");
	//debugger;
	for (var statement of statements) {
		if (statement.startsWith("output") || statement.startsWith("print")) { // output
			output += returnValue(statement.substring(7), memory) + "<br />";
		}
		else if (statement.startsWith("declare variable")) { // declare variable
			// e.g. declare variable alpha equal to integer 6
			var components = statement.split(" ");
			var components2 = statement.split(" equal to ");
			memory[components[2]] = returnValue(components2[1], memory);
		}
		else if (statement.startsWith("declare for loop")) {
			var forLoopComponents = statement.split(":");
			var counterDeclaration = forLoopComponents[0];
			var counterCondition = forLoopComponents[1];
			var counterOperation = forLoopComponents[2];

			for (var i=3; i<forLoopComponents.length; i++) {

			}
		}
	}
	return output;
	//console.log(output); // TODO change
}

function returnValue(valueStatement, memory) {
	var components = valueStatement.split(" ");
	if (valueStatement.startsWith("integer")) {
		return parseInt(components[1]);
	}
	else if (valueStatement.startsWith("text")) {
		return valueStatement.substring(5);
	}
	else if (valueStatement.startsWith("variable")) {
		return memory[components[1]];
	}
	else if (valueStatement.startsWith("addition") || valueStatement.startsWith("subtraction") || valueStatement.startsWith("multiplication") || valueStatement.startsWith("division")) {
		// addition of integer 7 and integer 10
		var newStatement = valueStatement.split(" of ")[1];
		var newStatementComponents = newStatement.split(" and ");
		var val1 = returnValue(newStatementComponents[0], memory);
		var val2 = returnValue(newStatementComponents[1], memory);

		if (valueStatement.startsWith("addition")) return val1 + val2;
		else if (valueStatement.startsWith("subtraction")) return val1 - val2;
		else if (valueStatement.startsWith("multiplication")) return val1 * val2;
		else if (valueStatement.startsWith("division")) return val1 / val2;
	}
}

// Create the XHR object.
function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// XHR for Chrome/Firefox/Opera/Safari.
		console.log(1);
		xhr.open(method, url, true);
	} else if (typeof XDomainRequest != "undefined") {
		// XDomainRequest for IE.
		console.log(2);
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		// CORS not supported.
		console.log(3);
		xhr = null;
	}
	return xhr;
}

// Helper method to parse the title tag from the response.
function getTitle(text) {
	return text.match('<title>(.*)?</title>')[1];
}

// Make the actual CORS request.
function makeCorsRequest(data) {
	// This is a sample server that supports CORS.
	var url = "http://verbalcoding-env.pimh5hpy38.us-east-2.elasticbeanstalk.com/helloworld?name=" + encodeURIComponent(data);

	var xhr = createCORSRequest('GET', url);
	if (!xhr) {
		console.log('CORS not supported');
		return;
	}

	// Response handlers.
	xhr.onload = function() {
		var text = xhr.responseText.replace(/\n/g, "~!@");
		document.getElementById("compiledCode").value = text;
		document.getElementById("compiledCodeButton").click();
		console.log('Response from CORS request to ' + url + ': ' + text);
	};

	xhr.onerror = function() {
		console.log('There was an error making the request.');
	};

	xhr.send();
}

document.getElementById("compiledCodeButton").onclick = function() {
	var compiledCode = document.getElementById("compiledCode").value.split("~!@");
	var currentLine = 1;
	document.getElementById("lineNumbers").innerHTML = "";
	document.getElementById("compiledCodeOutput").innerHTML = "";
	for (var statement of compiledCode) {
		if (statement.indexOf("##[") !== -1) continue;
		document.getElementById("lineNumbers").innerHTML += currentLine + "<br/>";
		document.getElementById("compiledCodeOutput").innerHTML += statement.split("//")[0] + "<br/>";
		currentLine++;
	}
	console.log(compiledCode);
	//compiledCode = compiledCode.replace(/\n/g, "<br/>");

};
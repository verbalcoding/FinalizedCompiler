var app = angular.module("verbal-coding", []);

var currentlySpeaking = false;

app.directive('myEnter', function () {
    return function ($scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
        	switch (event.which) {
            	case 70: // F
            		if ($scope.currMode === 0) {
						if (currentlySpeaking) {
							$scope.stopRecording();
						} else {
							$scope.toggleRecording();
						}
						currentlySpeaking = !currentlySpeaking;
					}
          			break;
				case 74: // J
					$scope.deleteLastStatement();
					break;
				case 32: // SPACE
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
	$scope.currMode = 0;

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
    	message.voice = voices[0];
    	message.rate = 0.75;
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

	var colors = ['output', 'text', 'hello', 'world'];
	var grammar = '#JSGF V1.0; grammar colors; public <color> = ' + colors.join(' | ') + ' ;';

    window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
	window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    var finalTranscript = '';
    let recognition = new window.SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

	var speechRecognitionList = new window.SpeechGrammarList();
	speechRecognitionList.addFromString(grammar, 1);
	recognition.grammars = speechRecognitionList;

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
    		case "For loop counter": letter = "F"; break; // for loop iterator
			case "For loop conditional": letter = "F"; break;
			case "For loop operator": letter = "F"; break;
    	}
    	var _class;
    	switch ($scope.codeBlocks[$scope.currCodeBlock].type) {
    		case "normal": _class = "purple"; break;
    		case "while": case "for": _class = "yellow"; break;
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
    	$scope.updateStatementLineNumbers();
    };

    $scope.switchMode = function() {
		if ($scope.currMode === 0) $scope.currMode = 1;
		else $scope.currMode = 0;
	};

    $scope.deleteLastStatement = function() {
		var workflowTable = document.getElementById("workflowTable").childNodes;
		workflowTable[workflowTable.length-1].remove();
		$scope.updateStatementLineNumbers();
		document.getElementById("deleteStatementAudio").play();
	};

    $scope.updateStatementLineNumbers = function() {
		var workflowTable = document.getElementById("workflowTable").childNodes;
		var currentLine = 1;
		for (var workflowStep of workflowTable) {
			var childNodes = workflowStep.childNodes;
			for (var childNode of childNodes) {
				if (childNode.classList.contains("type")) {
					childNode.innerHTML = currentLine++;
				}
			}
		}
	};

    $scope.compile = function() {
		document.getElementById("compiledCodeOutput").innerHTML = "";
    	if ($scope.currMode === 0) {
			var codeToSend = "";
			var codeToSendParts = document.getElementById("workflowTable").childNodes;
			var currDelim = ";";
			for (var node of codeToSendParts) {
				var childNodes = node.childNodes;
				for (var childNode of childNodes) {
					if (childNode.classList.contains("content")) {
						if (childNode.innerHTML === "declare for loop") currDelim = "@";
						else if (childNode.innerHTML === "declare while loop") currDelim = "#";
						else if (childNode.innerHTML === "declare if conditional") currDelim = ":";
						else if (childNode.innerHTML === "end for loop" || childNode.innerHTML === "end while loop" || childNode.innerHTML === "end conditional") {
							codeToSend += childNode.innerHTML + currDelim + ";";
							currDelim = ";";
						}
						else {
							codeToSend += childNode.innerHTML + currDelim;
						}
					}
				}
			}

			var output = compileCode(codeToSend);
			var outputParts = output.split("\n");
			for (var part of outputParts) {
				document.getElementById("compiledCodeOutput").innerHTML += part + "<br/>";
			}
			speak("Your code has been compiled. This is the output: " + output);
		}
    	else {
    		var rawText = document.getElementById("manualTextarea").value;
    		var formattedText = rawText.replace(/\n/g, "");
			var output = compileCode(formattedText);
			var outputParts = output.split("\n");
			for (var part of outputParts) {
				document.getElementById("compiledCodeOutput").innerHTML += part + "<br/>";
			}
			speak("Your code has been compiled. This is the output: " + output);
		}
	};

    $scope.addProject = function() {
		speak("What would you like to call this project?", function() {
			$scope.currentlyTalking = true;
			finalTranscript += " ";
			recognition.start();
			recognition.onend = function(e) {
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
	};

    $scope.stopRecording = function() {
    	recognition.stop();
	};
    
    $scope.toggleRecording = function() {
		if ($scope.currStep === 1) {
			$scope.currentlyTalking = false;
			document.getElementById("startSpeakingAudio").play();
			speak("", function () {
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
						content: fixText(finalTranscript.trim().toLowerCase()),
						id: new Date().getTime()
					});

					var str = $scope.workflow[$scope.workflow.length-1].content;
					if (str.indexOf("declare while loop") !== -1) {
						console.log("declare while loop"); // TODO ADD SUPPORT FOR DO-WHILE LOOPS BY ASKING FOR CONDITION TO BE PRE OR POST
						$scope.currStep = 4;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "while"});
						speak("Okay, I will start your while loop. Press F to say your next statement.");
					}
					else if (str.indexOf("declare for loop") !== -1) {
						console.log("declare for loop");
						$scope.currStep = 5;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "for"});
						speak("Okay, I will start your for loop. Press F to say your next statement.");
					}
					else if (str.indexOf("stop for loop") !== -1) {
						console.log("stop for loop");
						$scope.currStep = 1;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "normal"});
						speak("Okay, I have ended your for loop. Press F to say your next statement.");
					}
					else if (str.indexOf("stop while loop") !== -1) {
						console.log("stop while loop");
						$scope.currStep = 1;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "normal"});
						speak("Okay, I have ended your while loop. Press F to say your next statement.");
					}
					else {
						$scope.currStep = 1;
						speak("Okay, I heard " + fixText(finalTranscript.trim().toLowerCase()) + ". Press J to delete and F to say your next statement..");
					}
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
					finalTranscript = "";
		        };
			});
		}
		else if ($scope.currStep === 3) {
			$scope.currentlyTalking = false;
			document.getElementById("startSpeakingAudio").play();
			speak("", function () {
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
				document.getElementById("startSpeakingAudio").play();
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
				document.getElementById("startSpeakingAudio").play();
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
				document.getElementById("startSpeakingAudio").play();
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
				document.getElementById("startSpeakingAudio").play();
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "For loop operator",
						content: finalTranscript.trim().toLowerCase()
					});
					$scope.currStep = 1;
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
			        speak("Press F to start saying the commands of your for loop. Say 'stop for loop' to end the for loop.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
    };

	var keys = document.getElementsByClassName("key");
	for (var k=0; k<keys.length; k++) {
		var currKey = keys[k];
		currKey.onclick = function() {
			speak(this.innerHTML, function() {$scope.currentlyTalking = false;});
		}
	}
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

var output = "";
var memory = {};
var MAX_ITERATIONS = 1000;

function compiler(code) {
	var statements = code.split(";");
	for (var statement of statements) {
		if (statement.startsWith("output") || statement.startsWith("print")) {
			output += returnValue(statement.substring(7), memory) + "\n";
		}
		else if (statement.startsWith("declare variable")) {
			var components = statement.split(" ");
			var components2 = statement.split(" equal to ");
			memory[components[2]] = returnValue(components2[1], memory);
		}
		else if (statement.startsWith("declare array")) { // declare array alpha with elements integer 10
			var components = statement.split(" ");
			var length = returnValue(statement.split(" with elements ")[1], memory);
			memory[components[2]] = [];
			for (var i=1; i<=length; i++) memory[components[2]].push(undefined);
		}
		else if (statement.includes("populate")) { // sequentially/randomly populate array alpha
			var components = statement.split(" ");
			var identifier = components[3];
			for (var i=0; i<memory[components[3]].length; i++) {
				memory[components[3]][i] = statement.startsWith("sequentially") ? i+1 : Math.ceil(Math.random()*memory[components[3]].length);
			}
		}
		else if (statement.startsWith("declare for loop")) {
			var forLoopComponents = statement.split("@");
			var counterDeclaration = forLoopComponents[1];
			var counterCondition = forLoopComponents[2];
			var counterOperation = forLoopComponents[3];
			var counterIdentifier = forLoopComponents[1].split(" ")[2];
			compiler(counterDeclaration);
			var iterations = 0;
			while (evaluateSuperConditional(counterCondition, memory) && iterations <= MAX_ITERATIONS) {
				for (var i=4; i<forLoopComponents.length; i++) compiler(forLoopComponents[i]);
				if (counterOperation === "increment") memory[counterIdentifier]++;
				else if (counterOperation === "decrement") memory[counterIdentifier]--;
				iterations++;
			}
		}
		else if (statement.startsWith("declare while loop")) {
			var whileLoopComponents = statement.split("#");
			var whileCondition = whileLoopComponents[1];
			var iterations = 0;
			while (evaluateSuperConditional(whileCondition, memory) && iterations <= MAX_ITERATIONS) {
				for (var i=2; i<whileLoopComponents.length; i++) compiler(whileLoopComponents[i]);
				iterations++;
			}
		}
		else if (statement.startsWith("declare if conditional")) {
			var conditionalSequence = statement.replace("declare if conditional:", "").split("end conditional:");
			for (var conditionalComponent of conditionalSequence) {
				var condStatements = conditionalComponent.split(":");
				if (!condStatements[0]) continue;
				if (condStatements[0] === "else") {
					for (var j=1; j<condStatements.length; j++) {
						compiler(condStatements[j]);
					}
				}
				else {
					var condVal = evaluateSuperConditional(condStatements[0], memory);
					if (condVal) {
						for (var j=1; j<condStatements.length; j++) {
							compiler(condStatements[j]);
						}
						break;
					}
				}
			}
		}
	}
	return output;
}

function returnValue(valueStatement, memory) {
	var components = valueStatement.split(" ");
	if (valueStatement.startsWith("integer")) {
		return parseInt(components[1]);
	}
	else if (valueStatement.startsWith("decimal")) {
		return parseFloat(components[1]);
	}
	else if (valueStatement.startsWith("text")) {
		return valueStatement.substring(5);
	}
	else if (valueStatement.startsWith("variable")) {
		return memory[components[1]];
	}
	else if (valueStatement.startsWith("element")) { // element integer 2 of array alpha (zero-based)
	    debugger;
		var newStatement = valueStatement.split("element ")[1];
		var parts = newStatement.split(" of ");
		return returnValue(parts[1], memory)[returnValue(parts[0], memory)];
	}
	else if (valueStatement.startsWith("array")) {
		return memory[components[1]];
	}
	else if (valueStatement.startsWith("bool") || valueStatement.startsWith("boolean")) {
		if (components[1] === "true") return true;
		else if (components[1] === "false") return false;
		else return undefined;
	}
	else if (valueStatement.startsWith("root")) { // root variable alpha
		var newStatement = valueStatement.split("root ")[1];
		var val = returnValue(newStatement, memory);
		return Math.sqrt(val);
	}
	else if (valueStatement.startsWith("power")) { // power integer 9 to integer 2
		var newStatement = valueStatement.split("power ")[1];
		var newStatementComponents = newStatement.split(" to ");
		var val1 = returnValue(newStatementComponents[0], memory);
		var val2 = returnValue(newStatementComponents[1], memory);
		return Math.pow(val1, val2);
	}
	else if (valueStatement.startsWith("addition") || valueStatement.startsWith("subtraction") || valueStatement.startsWith("multiplication") || valueStatement.startsWith("division") || valueStatement.startsWith("modulus")) {
		var newStatement = valueStatement.split(" of ")[1];
		var newStatementComponents = newStatement.split(" and ");
		var val1 = returnValue(newStatementComponents[0], memory);
		var val2 = returnValue(newStatementComponents[1], memory);

		if (valueStatement.startsWith("addition")) return val1 + val2;
		else if (valueStatement.startsWith("subtraction")) return val1 - val2;
		else if (valueStatement.startsWith("multiplication")) return val1 * val2;
		else if (valueStatement.startsWith("division")) return val1 / val2;
		else if (valueStatement.startsWith("modulus")) return val1 % val2;
	}
}

function returnConditional(val1, relation, val2) {
	if (relation === "<=") return val1 <= val2;
	if (relation === ">=") return val1 >= val2;
	if (relation === "<") return val1 < val2;
	if (relation === ">") return val1 > val2;
	if (relation === "!=") return val1 !== val2;
	if (relation === "==") return val1 === val2;
}

function evaluateConditional(counterCondition, memory) {
	var condition;
	if (counterCondition.includes("less than or equal to")) {
		var components = counterCondition.split(" less than or equal to ");
		condition = "<=";
	}
	else if (counterCondition.includes("greater than or equal to")) {
		var components = counterCondition.split(" greater than or equal to ");
		condition = ">=";
	}
	else if (counterCondition.includes("less than")) {
		var components = counterCondition.split(" less than ");
		condition = "<";
	}
	else if (counterCondition.includes("greater than")) {
		var components = counterCondition.split(" greater than ");
		condition = ">";
	}
	else if (counterCondition.includes("not equal to")) {
		var components = counterCondition.split(" not equal to ");
		condition = "!=";
	}
	else if (counterCondition.includes("equal to")) {
		var components = counterCondition.split(" equal to ");
		condition = "==";
	}
	var val1 = returnValue(components[0], memory);
	var val2 = returnValue(components[1], memory);
	return returnConditional(val1, condition, val2);
}

function evaluateSuperConditional(superCond, memory) {
	// integer 9 less than integer 10 and integer 10 less than integer 11 or integer 7 less than integer 11
	if (!(superCond.includes("or") || superCond.includes("and"))) {
		return evaluateConditional(superCond, memory);
	}
	else {
		var separators = ['and', 'or'];
		var tokens = superCond.split(new RegExp('[' + separators.join('') + ']', 'g'));
		var results = [];
		for (var token of tokens) {
			results.push(evaluateConditional(token, memory));
		}

		var regex = /and/gi, result, indices = [];
		while ( (result = regex.exec(superCond)) ) {
			indices.push({type: 'and', i: result.index});
		}
		regex = /or/gi;
		while ( (result = regex.exec(superCond)) ) {
			indices.push({type: 'or', i: result.index});
		}
		indices.sort((a,b) => (a.i > b.i) ? 1 : ((b.i > a.i) ? -1 : 0));

		var result = results[0];
		for (var i=1; i<results.length; i++) {
			result = (indices[i-1].type === 'and') ? result && results[i] : result || results[i];
		}
		return result;
	}
}

function compileCode(code) {
	output = "";
	memory = {};
	return compiler(code);
}

function occurrences(string, subString, allowOverlapping) {
	string += "";
	subString += "";
	if (subString.length <= 0) return (string.length + 1);

	var n = 0,
		pos = 0,
		step = allowOverlapping ? 1 : subString.length;

	while (true) {
		pos = string.indexOf(subString, pos);
		if (pos >= 0) {
			++n;
			pos += step;
		} else break;
	}
	return n;
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

function fixText(code) {
	if (code.startsWith("put")) return code.replace("put", "output");
	return code;
}

// Make the DIV element draggable:
dragElement(document.getElementById("keyboard"));

function dragElement(elmnt) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	if (document.getElementById(elmnt.id + "header")) {
		// if present, the header is where you move the DIV from:
		document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
	} else {
		// otherwise, move the DIV from anywhere inside the DIV:
		elmnt.onmousedown = dragMouseDown;
	}

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}
}
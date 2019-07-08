$(document).ready(function () {
	function logResults(json) {
		console.log("received");
		console.log(json);
	}

	$.ajax({
		url: "http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=output%20text%20hello%20world",
		dataType: "jsonp",
		jsonpCallback: "logResults"
	});
});

var app = angular.module("verbal-coding", []);

app.directive('myEnter', function () {
    return function ($scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
        	switch (event.which) {
        		/*case 102:
        			 $scope.$apply(function (){
                    	$scope.$eval(attrs.myEnter);
                	});
                	event.preventDefault();
                	break;*/
            	case 70:
            		$scope.toggleRecording();
          			break;
        	}
        });
    };
});

app.config(function($sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
        'self',                    // trust all resources from the same origin
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
	$scope.wkflw = ['a', 'b', 'c', 'd', 'e'];

	/*$http({
		method: "GET",
		url: "http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=output%20text%20hello%20world",
		dataType: 'json',
		headers: {'Authorization': 'Token token=xxxxYYYYZzzz'}
	}).then(function mySuccess(response) {
	    console.log(response);
	}, function myError(response) {
	    console.log(response);
	});*/

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
    }

    var addToWorkflow = function (obj) {
    	obj.codeBlock = $scope.currCodeBlock;
    	$scope.workflow.push(obj);
    	var letter;
    	switch (obj.type) {
    		case "Command": letter = "S"; break;
    		case "While loop": letter = "W"; break;
    	}
    	var _class;
    	switch ($scope.codeBlocks[$scope.currCodeBlock].type) {
    		case "normal": _class = "purple"; break;
    		case "while": _class = "yellow"; break;
    		default: _class = "purple"; break;
    	}
    	document.querySelector('#workflowTable').innerHTML += "<div class='workflowStep " + _class +  "' data-workflowid='" + obj.id + "'><div class='type'>" + letter + "</div><div class='content'>" + obj.content + "</div><div class='delete'>&#215;</div></div>";
    	$('.workflowStep[data-workflowid="' + obj.id + '"] .delete').on('click', function () {
			var id = $(this).parent().attr("data-workflowid");
			$(this).parent().remove();
			for (var i=0; i<$scope.workflow.length; i++) {
				if ($scope.workflow[i].id == id) {
					$scope.workflow.splice(i, 1);
				}
			}
		});
    }
    
    $scope.toggleRecording = function() {
		if ($scope.currStep == 1) {
			$scope.currentlyTalking = false;
			speak("Say a statement.", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "Command",
						content: finalTranscript.trim().toLowerCase(),
						id: new Date().getTime()
					});
					var str = $scope.workflow[$scope.workflow.length-1].content;
					if (str.indexOf("start") !== -1 && str.indexOf("while") !== -1) {
						console.log("start while");
						$scope.currStep = 4;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "while"});
						speak("Okay, I am processing your request. Press F to continue.");
					}
					/*else if (str.indexOf("start") !== -1 && (str.indexOf("for") !== -1 || str.indexOf("four") !== -1 || str.indexOf("4") !== -1)) {
						console.log("start for");
						$scope.currStep = 5;
						$scope.currCodeBlock++;
						$scope.codeBlocks.push({type: "for"});
						speak("Okay, I am processing your request. Press F to continue.");
					}*/
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
		/*else if ($scope.currStep == 2) {
			$scope.currentlyTalking = false;
			speak("You want to print, right?", function () {
				$scope.currentlyTalking = true;
				finalTranscript += " ";
				recognition.start();
				recognition.onend = function(e) {
					$scope.currentlyTalking = false;
					addToWorkflow({
						type: "Yes or No",
						content: finalTranscript.trim().toLowerCase()
					});
					switch ($scope.workflow[$scope.workflow.length-1].content) {
						case "yes":
						case "yeah":
							$scope.currStep = 3;
							break;
						default:
							$scope.currStep = 1;
							break;
					}
					document.querySelector('#interimText').innerHTML = "<span>Press F to speak.</span>";
					finalTranscript = "";
			        speak("Press F to continue.", function () {
			        	$scope.currentlyTalking = false;
			        });
		        };
			});
		}*/
		else if ($scope.currStep == 3) {
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
			        /*$.ajax({
					    url: "http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=" + encodeURIComponent(finalTranscript.trim().toLowerCase()),
					    headers: {
					        'Content-Type': 'application/x-www-form-urlencoded'
					    },
					    type: "GET", /* or type:"GET" or type:"PUT" 
					    dataType: "jsonp",
					    data: {
					    },
					    success: function (result) {
					        console.log(result);    
					    },
					    error: function () {
					        console.log("error");
					    }
					});*/
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
					  /*$http.jsonp("http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=" + encodeURIComponent(finalTranscript.trim().toLowerCase()), {jsonpCallbackParam: 'callback'})
					    .then(function(data){
					        console.log(data);
					    });*/
			        /*$.ajax({
			        	url: "http://visualcoding-env.ekv2qhpcaa.us-east-2.elasticbeanstalk.com/helloworld?name=" + encodeURIComponent(finalTranscript.trim().toLowerCase()),
						data: {
							format: 'json'
						},
						dataType: 'jsonp',
						type: 'GET',
						success: function(data) {
							console.log("Data: " + data + "\nStatus: " + status);
						}
			        });*/
			        finalTranscript = "";
		        };
			});
			$scope.currStep = 1;
		}
		else if ($scope.currStep = 4) {
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
		else if ($scope.currStep = 5) {
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
		else if ($scope.currStep = 6) {
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
		else if ($scope.currStep = 7) {
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
			        speak("Press F to continue.", function () {
			        	$scope.currentlyTalking = false;
			        });
			        finalTranscript = "";
		        };
			});
		}
    };

    /*setInterval(function() {o
    	console.log($scope.workflow);
    }, 100);*/
}]);
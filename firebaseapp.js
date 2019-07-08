// FIREBASE AUTH

var firebaseConfig = {
	apiKey: "AIzaSyCJuUb2TnP3EFw1IFYypHY6K8AUZpuiQeE",	
	authDomain: "api-project-797042688460.firebaseapp.com",
	databaseURL: "https://api-project-797042688460.firebaseio.com",
	projectId: "api-project-797042688460",
	storageBucket: "api-project-797042688460.appspot.com",
	messagingSenderId: "797042688460",
	appId: "1:797042688460:web:f7948cf3ed0be9e9"
};

firebase.initializeApp(firebaseConfig);
//var database = firebase.database();

var uiConfig = {
	callbacks: {
	    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
	    	// User successfully signed in.
	    	return false;
	    },
	    uiShown: function() {
	    	//document.getElementById('loader').style.display = 'none';
	    }
  	},
	signInFlow: 'popup',
	signInSuccessUrl: '#',
	signInOptions: [
		firebase.auth.EmailAuthProvider.PROVIDER_ID
	],
	// Terms of service url/callback.
	tosUrl: '<your-tos-url>',
	// Privacy policy url/callback.
	privacyPolicyUrl: function() {
		window.location.assign('<your-privacy-policy-url>');
	}
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', uiConfig);

/*firebase.initializeApp({
  apiKey: 'AIzaSyCJuUb2TnP3EFw1IFYypHY6K8AUZpuiQeE',
  authDomain: 'api-project-797042688460.firebaseapp.com',
  projectId: 'api-project-797042688460'
});*/

var db = firebase.firestore();

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	console.log(user);
  	document.getElementById('userIdInput').value = user.uid;
  	document.getElementById('userName').innerHTML = user.displayName;
  	document.getElementById('bodyContainer').style.display = "grid";
  	document.getElementById('firebaseui-auth-container').style.display = "none";
  	document.getElementsByTagName("BODY")[0].classList.remove("notSignedIn");
  	document.getElementById('welcomeDiv').style.display = "none";
  	$('#bodyContainer').fadeIn();

  	db.collection("projects").where("userId", "==", user.uid)
  		.get()
  		.then(function(querySnapshot) {
  			var projectCount = 0;
  			querySnapshot.forEach(function(doc) {
  				projectCount++;
  				doc = doc.data();
  				$('#projectsTable').append('<tr><td><i class="material-icons">book</i></td><td><span>' + doc.projectName + '</span><br /><div class="codePreview">' + doc.code + '</div></td></tr>');
  			});
  			if (projectCount !== 0) {
  				$('#projectsTable').show();
  				$('#noProjectsDiv').hide();
  			}
  			else {
  				$('#projectsTable').hide();
  				$('#noProjectsDiv').show();
  			}
  			$('#projects .spinIcon').hide();
  		})
  		.catch(function(error) {
  			console.log("Error getting documents");
  		});
  } else {
  	document.getElementById('userIdInput').value = "";
    document.getElementById('bodyContainer').style.display = "none";
    document.getElementById('firebaseui-auth-container').style.display = "flex";
    document.getElementsByTagName("BODY")[0].classList.add("notSignedIn");
    document.getElementById('welcomeDiv').style.display = "flex";
  }
});

// FIRESTORE

// JQUERY

document.getElementById('addProjectButton').onclick = function() {
	db.collection("projects").add({
		userId: document.getElementById('userIdInput').value,
		projectName: document.getElementById('currProjNameInput').value,
		code: document.getElementById('currWorkflowInput').value
	})
	.then(function(docRef) {
    	console.log("Document written with ID: ", docRef.id);
	})
	.catch(function(error) {
	    console.error("Error adding document: ", error);
	});
};

document.getElementById('signOut').onclick = function() {
	firebase.auth().signOut().then(function () {
		document.getElementById('bodyContainer').style.display = "none";
		document.getElementById('firebaseui-auth-container').style.display = "flex";
		console.log("You signed out");
	}).catch(function (error) {
		console.log("You couldn't sign out");
	});
};
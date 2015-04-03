var appClass = function(){
	var PAGE_LOADED_BIT_INDEX = 0;
	var DEVICE_READY_BIT_INDEX = 1;
	var MAXIMUM_NUMBER_OF_DISPLAYED_CONTACTS = 12;

	var bitMapClass = function(n){
        var value = n;
        var setBit = function(bitIndex){
            value |= (0x01<<bitIndex);
        }

        var isBitSet = function(bitIndex){
            return value &(0x01<<bitIndex);
        }

        var reset = function(){
            value = 0;
        }

        return {
            reset: reset,
            setBit: setBit,
            isBitSet : isBitSet
        }
    };

	var svgClass = function(){

		var load = function(){
			/* Load all svg images and set their tap event listeners. */
			var svgElementsArray = document.querySelectorAll("svg[data-icon-name]");
			for(var i=0; i<svgElementsArray.length; i++){
				var svgElement = svgElementsArray[i];

				/* Get a reference to the embedded svg tag in the HTML document using Snap SVG*/
				var snapCanvas = Snap( svgElement );

				/* SVG tag must have a custom data set whose value matches SVG file name */
				var iconNameDataSet = svgElement.getAttribute("data-icon-name");

				/* Load SVG group content into HTML doc through snap svg library.
				Note that JS Closure must have been used because load method is asynchronous
				and snap svg canvas must be locked to load the vector graphic inside svg
				element correctly.*/
				Snap.load( "svg/"+iconNameDataSet+".svg", (function (myCanvas) {
					return function(fragment){
						var group = fragment.select( 'g' );
						myCanvas.append( group );
					}
				})(snapCanvas));

			}
		}

		return{
				load: load
		}
	};

	var siteNavigatorClass = function(){
		var pages = {};
		var numPages = 0;
		var currentPageId = null;
		var currentUserId = -1;

		var init = function(){

			var pagesArray = document.querySelectorAll('[data-role="page"]');
			numPages = pagesArray.length;


			/* save pages into js object where the key is the same as the given page id*/
			for(var i=0; i< numPages; i++){
				pages[pagesArray[i].getAttribute("id")] = pagesArray[i];
			}
			delete pagesArray; //Free the memory to increase performance.

			doPageTransition(null, "people");

			/* Add swipe left/right listeners to people/occaisions pages*/
			var peopleHammerManger = new Hammer(pages["people"]);
			peopleHammerManger.on('swipeleft', handleSwipe);

			var occaisionsHammerManger = new Hammer(pages["occaisions"]);
			occaisionsHammerManger.on('swiperight', handleSwipe);

			/* Add tap/double tap event listeners to list view of contacts. */
			var contactsListView = document.querySelector('ul[data-role="listview"]');

			/* Relate tap and double tap events to list view of contacts using hammer API */
			var contactListHammerManager = new Hammer.Manager(contactsListView);

			/* Create specifications for single tap and double tap events. */
			var doubleTapEvent = new Hammer.Tap({ event: 'doubletap', taps: 2 }) ;
			var singleTapEvent = new Hammer.Tap({ event: 'singletap', domEvents:true });

			/* Add single/double tap events to hammer manager.*/
			contactListHammerManager.add( doubleTapEvent );
			contactListHammerManager.add( singleTapEvent);

			/* we want to recognize single/double tap simulatenously. Otherwise single tap handler will be always triggered during double tap event.
			So a double tap will be detected even a single tap has been recognized.*/
			doubleTapEvent.recognizeWith('singletap');

			/* we only want to trigger a tap, when we don't have detected a doubletap. */
			singleTapEvent.requireFailure('doubletap');

			/* register handler for single/double tap events. */
			contactListHammerManager.on("doubletap", handleDoubleTap );
			contactListHammerManager.on("singletap", handleSingleTap);

			// var cancelBtnHammerManager = new Hammer( document.getElementById("btnCancel"));
			// cancelBtnHammerManager.on('tap', handleCancelTap);

			// var okBtnHammerManager = new Hammer( document.getElementById("btnOk"));
			// okBtnHammerManager.on('tap', handleOkTap);

			// var cancelBtnGPSHammerManager = new Hammer( document.getElementById("btnCancelGPS"));
			// cancelBtnGPSHammerManager.on('tap', handleCancelTapForGPS);

			// var settingsBtnGPSHammerManager = new Hammer( document.getElementById("btnSettingsGPS"));
			// settingsBtnGPSHammerManager.on('tap', handleSettingsTapForGPS);

			// okBtnHammerManager = new Hammer(document.getElementById("btnOkUserLoc"));
			// okBtnHammerManager.on('tap', handleOkTap);

			// var backBtnHammerManager = new Hammer(document.querySelector('svg[data-icon-name="back"]'));
			// backBtnHammerManager.on('tap', handleBackButton);

			// /* Wait until the trigger of current location request is timed-out.
			// handle error case by showing a warning message to the user to open his GPS */
			// setTimeout(mapDriver.loadMap, 3600);
		}
		var handleSwipe = function(ev){
			console.log(ev.type + " gesture detected");
			var currentPageId = document.URL.split("#")[1];
			console.log("currentPageId is :"+ currentPageId);

			// var mainScreenHeader = document.querySelector('header.main-screen');
			// var title = mainScreenHeader.querySelector('h2');

			switch(currentPageId){
				case "people":
					var destPageId = "occaisions";
					var outClass = 'pt-page-fade';
					var inClass = 'pt-page-moveFromRight pt-page-ontop';
					break;
				case "occaisions":
					var destPageId = "people";
					var outClass = 'pt-page-fade';
					var inClass = 'pt-page-moveFromLeft pt-page-ontop';
					break;
				default:
					console.error("undefined page id");
					return;
			}
			// title.innerHTML = destPageId;
			doPageTransition(currentPageId, destPageId, outClass, inClass, false);
		}

		// var handleSettingsTapForGPS = function(ev){
		// 				document.querySelector('#gps-modal-window').className = "hide";
		// 				/* TODO: Show Device settings app.*/
		// }

		// var handleCancelTapForGPS = function(ev){
		// 				document.querySelector('#gps-modal-window').className = "hide";
		// }

		// var handleCancelTap = handleOkTap = function(ev){
		// 				if('btnOkUserLoc' === ev.target.getAttribute("id")){
		// 								document.querySelector('#user-loc-modal-window').className = "hide";
		// 				}else{
		// 								document.querySelector('#contacts-modal-window').className = "hide";
		// 				}

		// }

		var handleDoubleTap = function(ev){
			console.log("Double tap event has been recognized");

			/* Get which list item have been tapped. Since hammer.js does not have currentTarget property, a bubbling
			* navigation must be done toward the parent element(s) to find out which contact has been double-tapped */
			// var timeStamp1 = Date.now();
			var currentTarget = ev.target;
			var contactId = currentTarget.getAttribute("data-ref");
			while(null === contactId){
						currentTarget = currentTarget.parentNode;
						contactId     = currentTarget.getAttribute("data-ref");
			}

			/* Make sure that we find a valid contanct list item */
			if(contactId){
						currentUserId = contactId;
						/* TODO: remove item from listview and delete it from the database.*/
			}
		}

		var handleSingleTap = function(ev){
			console.log("Single tap event has been recognized");
			/* TODO: A single tap on a list item in the People or Occasion screens will open the
			screen for managing the gifts for the selected person or occasion.*/

			/* TODO: A single tap on a gift idea will toggle the purchased status.
			you will need to find a visual way to represent that status.*/

			var contactModalWindow = document.querySelector('#contacts-modal-window');

			/* display modal window that will display the contact's name as well as all phone numbers for that contact. */

			/* Get which list item have been tapped. Since hammer.js does not have currentTarget property, a bubbling
			* navigation must be done toward the parent element(s) to find out which contact has been tapped */

			var currentTarget = ev.target;
			var contactId = currentTarget.getAttribute("data-ref");
			while(null === contactId){
						currentTarget = currentTarget.parentNode;
						contactId     = currentTarget.getAttribute("data-ref");
			}

			/* Make sure that we find a valid contanct list item */
			if(contactId){
				currentUserId = contactId;
			}

			contactModalWindow.className = "show";

		}

		var loadDynamicContents = function(pageId){
			// switch(pageId){
			// 	case "contacts":

			// 		document.querySelector('.col-header:first-child').classList.add("hide");

			// 		/* Generate a random number from the available contacts to be displayed.
			// 		Note that a random number will be generated in the range (0, maximum length of contacts -1)*/

			// 		if(contacts.getEntries()){
			// 			var listView = document.querySelector('ul[data-role="listview"]');
			// 			/* display maximum 12 contacts. */
			// 			for(var i=0;
			// 				(i< contacts.getEntries().length) &&  (i< MAXIMUM_NUMBER_OF_DISPLAYED_CONTACTS);
			// 				i++){

			// 				var listItem = listView.querySelector('li[data-ref="'+i+'"]');

			// 				var contactNameTag = listItem.querySelector('p.contact-name');
			// 				contactNameTag.innerHTML = contacts.getDisplayName(i);

			// 				if(contacts.getPhoto(i)){
			// 								var contactPhotoTag = listItem.querySelector('img.contact-img');
			// 								contactPhotoTag.src = contacts.getPhoto(i);
			// 				}

			// 				listItem.classList.remove("hide");

			// 				/* save displayed contacts to local storage. */
			// 				storage.saveData(i,
			// 								{
			// 									"name"       : contacts.getDisplayName(i),
			// 									"phoneNumbers"    : contacts.getPhoneNumbers(i),
			// 									"addressess" : contacts.getAddresses(i),
			// 									"emails"     : contacts.getEmails(i),
			// 									"latLng"     : storage.getData("latLng")
			// 								});
			// 			}
			// 	}


			// 	break;
			// 	case "location":

			// 					break;
			// 	default:
			// }
		}

		var animatePage = function(pg){
			pg.classList.add("active-page");
		}

		var hidePage = function(pg){
			pg.className = "hide";
		}

		//Deal with history API and switching divs
		var doPageTransition = function( srcPageId, destPageId,
										 outClass, inClass,
										 isHistoryPush){

			if(srcPageId == null){

				//home page first call
				pages[destPageId].classList.add("pt-page-current");
				pages[destPageId].classList.add("pt-page-fadeIn");
				loadDynamicContents(destPageId);
				setTimeout(function(){
						pages[destPageId].classList.remove("pt-page-fadeIn");
				}, 1000); /* 0.6sec is the animation duration. */
				history.replaceState(null, null, "#"+destPageId);
			}else{

				pages[srcPageId].classList.add("pt-page-current");
				pages[destPageId].classList.add("pt-page-current");
				pages[srcPageId].classList.add(outClass);
				pages[destPageId].classList.add(inClass.split(" ")[0]);
				pages[destPageId].classList.add(inClass.split(" ")[1]);


				loadDynamicContents(destPageId);

				/* Wait for 30 msec before applying the animation of page transition. This gives the
				browser time to update all the divs before applying the animation*/
				setTimeout(function(){
								pages[srcPageId].classList.remove("pt-page-current");
								pages[srcPageId].classList.remove(outClass);
								pages[destPageId].classList.remove(inClass.split(" ")[0]);
								pages[destPageId].classList.remove(inClass.split(" ")[1]);
				}, 600); /* 0.6sec is the animation duration. */

				if (true === isHistoryPush)
					history.pushState(null, null, "#" + destPageId);
				else if(false === isHistoryPush)
					history.replaceState(null, null, "#"+destPageId);
			}/* else srcPageId is not null*/

			currentPageId = destPageId;
			/* after loading any page, make sure to scroll to the top of this page. */
			setTimeout(function(){window.scrollTo(0,0);}, 10);
		}

		//Listener for the popstate event to handle the back button
		var handleBackButton = function (ev){
			ev.preventDefault();
			var destPageId = "contacts";
			var currentPageId = "location";
			//update the visible data page.
			// doPageTransition(currentPageId, destPageId, false);
		}

		var getCurrerntUserId = function(){
			return currentUserId;
		}

		return {
					init : init,
					handleBackButton: handleBackButton,
					getCurrerntUserId: getCurrerntUserId
		}
	};

	/* This is a bit map that represents a bit for every events that is needed to be fired before
	using the app services in the device.
	There is a bit for DOMContentLoaded event and another bit for deviceready event.
	Create a new instance for bit map with value zero which means no events have been recieved yet. */
	var readyBitMap = new bitMapClass(0);
	var siteNavigator = new siteNavigatorClass();

	var init = function(){
		document.addEventListener("deviceready", onDeviceReady, false);
		document.addEventListener("DOMContentLoaded", onPageLoaded, false);
		window.addEventListener("resize", onWindowResize, true);

		//add the listener for the back button
		window.addEventListener("popstate", siteNavigator.handleBackButton, false);
	}

	var onDeviceReady = function(){
		console.log("Device is ready");
		readyBitMap.setBit(DEVICE_READY_BIT_INDEX);
		onReady();
	}

	var onPageLoaded = function(){
		console.log("Page is loaded");
		readyBitMap.setBit(PAGE_LOADED_BIT_INDEX);


		var svgIcons = new svgClass();
		svgIcons.load();

		/*TODO: Remove the following line before final delivery of the app.*/
		if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            console.debug("Running application from device");
       		/* Do nothing. */
        } else {
            console.debug("Running application from desktop browser");
            siteNavigator.init();
        }
		onReady();
	}

	var onReady = function(){
		if(readyBitMap.isBitSet(DEVICE_READY_BIT_INDEX) &&
						readyBitMap.isBitSet(PAGE_LOADED_BIT_INDEX)){
			console.log("Both evenets have been fired");
			//TODO:connect to database
			//TODO:build the lists for the main pages based on data
			//TODO:add button and navigation listeners

			siteNavigator.init();

		}else{
				console.log("Both evenets has not been fired yet");
		}
	}

	var onWindowResize = function(){
		console.log("Window resize event has been fired");
	}

	return {
				init: init
	}
};

var show0017 = new appClass();
show0017.init();

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

				/* Each page contains a list view.
				Add tap/double tap event listeners to the corresponding list view */
				var listView = pagesArray[i].querySelector('ul[data-role="listview"]');

				/* Relate tap and double tap events to list view of contacts using hammer API */
				var listHammerManager = new Hammer.Manager(listView);
				listHammerManager.myParam = i;

				/* Create specifications for single tap and double tap events. */
				var doubleTapEvent = new Hammer.Tap({ event: 'doubletap', taps: 2 }) ;
				var singleTapEvent = new Hammer.Tap({ event: 'singletap', domEvents:true });

				/* Add single/double tap events to hammer manager.*/
				listHammerManager.add( doubleTapEvent );
				listHammerManager.add( singleTapEvent);

				/* we want to recognize single/double tap simulatenously. Otherwise single tap handler will be always triggered during double tap event.
				So a double tap will be detected even a single tap has been recognized.*/
				doubleTapEvent.recognizeWith('singletap');

				/* we only want to trigger a tap, when we don't have detected a doubletap. */
				singleTapEvent.requireFailure('doubletap');

				/* register handler for single/double tap events. */
				listHammerManager.on("doubletap", handleDoubleTap );
				listHammerManager.on("singletap", handleSingleTap);
			}
			delete pagesArray; //Free the memory

			/* Add modal to the pages array to be capable of applying page transitions for modal windows as well. */
			var modalsArray = document.querySelectorAll('[data-role="modal"]');
			var numModals = modalsArray.length;
			for(var i=0; i< numModals; i++){
				pages[modalsArray[i].getAttribute("id")] = modalsArray[i];

				/* Each modal window contains cancel and save button. Add corresponding listeners */
				var cancelBtn = modalsArray[i].querySelector('input[value="CANCEL"]');
				var cancelBtnHammerManager = new Hammer(cancelBtn);
				cancelBtnHammerManager.on('tap', handleCancelTap);

				var saveBtn = modalsArray[i].querySelector('input[value="SAVE"]');
				var saveBtnHammerManager = new Hammer(saveBtn);
				saveBtnHammerManager.on('tap', handleSaveTap);

			}
			delete modalsArray; //Free the memory

			doPageTransition(null, "people");

			/* Add swipe left/right listeners to people/occasions pages*/
			var peopleHammerManger = new Hammer(pages["people"]);
			peopleHammerManger.on('swipeleft', handleSwipe);

			var occasionsHammerManger = new Hammer(pages["occasions"]);
			occasionsHammerManger.on('swiperight', handleSwipe);

			var backBtnsArray = document.querySelectorAll('svg[data-icon-name="back"]');
			for(var i=0; i<backBtnsArray.length; i++){
				var backBtnHammerManager = new Hammer(backBtnsArray[i]);
				backBtnHammerManager.on('tap', handleBackButton);
			}

			var addBtnsArray = document.querySelectorAll('svg[data-icon-name="add"]');
			for(var i=0; i<addBtnsArray.length; i++){
				var addBtnHammerManager = new Hammer(addBtnsArray[i]);
				addBtnHammerManager.on('tap', handleAddButton);
			}
		}

		var handleSwipe = function(ev){
			console.log(ev.type + " gesture detected");
			var currentPageId = document.URL.split("#")[1];

			var outClass = 'pt-page-fadeOut';

			switch(currentPageId){
				case "people":
					var destPageId = "occasions";
					var inClass = 'pt-page-moveFromRight pt-page-ontop';
					break;
				case "occasions":
					var destPageId = "people";
					var inClass = 'pt-page-moveFromLeft pt-page-ontop';
					break;
				default:
					console.error("undefined page id");
					return;
			}

			doPageTransition(currentPageId, destPageId, outClass, inClass, false);
		}

		var handleCancelTap = function(ev){
			removeModalWindow();
		}

		var removeModalWindow = function(){
			var destPageId = document.URL.split("#")[1];
			// var currentPageId = document.querySelector('[data-role="modal"].pt-page-current');
			pages[currentPageId].classList.add("pt-page-moveToBottom");
			setTimeout(function(){
				pages[currentPageId].classList.remove("pt-page-current");
				pages[currentPageId].classList.remove("pt-page-moveToBottom");
				currentPageId = destPageId;
			}, 600);
		}

		var handleSaveTap = function(ev){
			/* TODO: update database properly. */

			removeModalWindow();
		}

		var handleDoubleTap = function(ev){
			var currentPageId = document.URL.split("#")[1];
			console.log("Double tap event has been recognized inside page:" + currentPageId);

			/* Get which list item have been tapped. Since hammer.js does not have currentTarget property, a bubbling
			* navigation must be done toward the parent element(s) to find out which contact has been double-tapped */

			var currentTarget = ev.target;
			var listItemId = currentTarget.getAttribute("data-ref");
			while(null === listItemId){
						currentTarget = currentTarget.parentNode;
						listItemId     = currentTarget.getAttribute("data-ref");
			}

			// /* Make sure that we find a valid contanct list item */
			if(listItemId){
				currentUserId = listItemId;
				/* TODO: remove item from listview and delete it from the database.*/
			}
		}

		var handleSingleTap = function(ev){

			var currentPageId = document.URL.split("#")[1];
			console.log("Single tap event has been recognized inside page:"+currentPageId);

			/* A single tap on a list item in the People or Occasion screens will open the
			screen for managing the gifts for the selected person or occasion.*/

			/* TODO: A single tap on a gift idea will toggle the purchased status.
			you will need to find a visual way to represent that status.*/

			// var contactModalWindow = document.querySelector('#contacts-modal-window');



			/* Get which list item have been tapped.*/
			var listItem = ev.target;
			console.debug(listItem);
			var listItemId = listItem.getAttribute("data-ref");

			/* Make sure that we find a valid list item */
			if(listItemId){
				switch (currentPageId){
					case "people":
						var destPageId = "gifts-per-person";
						var outClass = "pt-page-scaleDown";
						var inClass = "pt-page-scaleUp";

						var subHeader = pages[destPageId].querySelector('.page-internal-wrapper h2');
						subHeader.innerHTML = "Gifts for " + listItem.innerHTML;

						doPageTransition(currentPageId,destPageId,outClass,inClass,true);
						break;
					case "occasions":
						var destPageId = "gifts-per-occasion";
						var outClass = "pt-page-scaleDown";
						var inClass = "pt-page-scaleUp";

						var subHeader = pages[destPageId].querySelector('.page-internal-wrapper h2');
						subHeader.innerHTML = "Gifts for " + listItem.innerHTML;

						doPageTransition(currentPageId,destPageId,outClass,inClass,true);
						break;
					default:
						/*Do nothing*/
				}
			}else{
				console.error("Failed to find valid list item id");
			}
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
					rotateAddButton(destPageId);
				}, 1000); /* 1sec is the animation duration. */
				history.replaceState(null, null, "#"+destPageId);
			}else{

				// pages[srcPageId].classList.add("pt-page-current");
				pages[destPageId].classList.add("pt-page-current");
				pages[srcPageId].className  += " "+outClass;
				pages[destPageId].className += " "+inClass;

				/* Get current styles for the destination page.*/
				var style = window.getComputedStyle(pages[destPageId], null);

				/* Get animation duration ( in millisecond )for the destination page.
				Remove last character which is 's' then parse the number*/
				var animationDuration = parseFloat(style.webkitAnimationDuration.slice(0,-1))* 1000;
				/* Get animation delay ( in millisecond ) for the destination page.*/
				var animationDelay = parseFloat(style.webkitAnimationDelay.slice(0,-1))* 1000;

				// console.log(animationDuration);

				loadDynamicContents(destPageId);

				/* Wait for 30 msec before applying the animation of page transition. This gives the
				browser time to update all the divs before applying the animation*/
				setTimeout(function(){
					/* Remove pt-page-current class and outClass from source page.
					Exception case: when displaying modal window, make sure to keep source page in the background*/
					pages[srcPageId].className = outClass?"":"pt-page-current";
					pages[destPageId].className = "pt-page-current";
					rotateAddButton(destPageId);
					// pages[destPageId].classList.remove(inClass.split(" ")[0]);
					// pages[destPageId].classList.remove(inClass.split(" ")[1]);
				}, animationDuration + animationDelay); /* 0.6sec is the animation duration. */

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
			var currentPageId = document.URL.split("#")[1];

			switch (currentPageId){
				case "gifts-per-person":
					var destPageId = "people";
					break;
				case "gifts-per-occasion":
					var destPageId = "occasions";
					break;
				default:
					/*Do nothing*/
			}
			var outClass = "pt-page-scaleDown";
			var inClass = "pt-page-scaleUp";

			doPageTransition(currentPageId,destPageId,outClass,inClass,true);
		}

		var handleAddButton = function (ev){
			var currentPageId = document.URL.split("#")[1];

			switch (currentPageId){
				case "people":
					var destPageId = "add-person-or-occasion";
					var title = "New Person";
					var placeHolder = "new person";
					break;
				case "occasions":
					var destPageId = "add-person-or-occasion";
					var title = "New Occasion";
					var placeHolder  = "new occasion";
					break;
				case "gifts-per-person":
					var destPageId = "add-gift";

					/* TODO: Get the name of the person from database.*/
					var subHeader = pages[currentPageId].querySelector('.page-internal-wrapper h2');
					/* Gifts for Person */
					var re = /(Gifts for)\s+(.*)/;
					var personName = subHeader.innerHTML.match(re)[2];
					var title = "New Gift for "+ personName;
					var placeHolder = "new gift idea";
					break;
				case "gifts-per-occasion":
					/* TODO: Get the name of the occasion from database.*/
					var destPageId = "add-gift";
					/* TODO: Get the name of the person from database.*/
					var subHeader = pages[currentPageId].querySelector('.page-internal-wrapper h2');
					/* Gifts for Person */
					var re = /(Gifts for)\s+(.*)/;
					var occasionName = subHeader.innerHTML.match(re)[2];
					var title = "New Gift for "+ occasionName;
					var placeHolder = "new gift idea";
					break;
				default:
					/*Do nothing*/
			}
			var outClass = "";
			var inClass = "pt-page-moveFromBottom";

			pages[destPageId].querySelector('h3').innerHTML = title;

			var inputField = pages[destPageId].querySelector('input[type="text"]');
			inputField.setAttribute("placeholder", placeHolder);

			doPageTransition(currentPageId,destPageId,outClass,inClass);
		}
		var getCurrerntUserId = function(){
			return currentUserId;
		}

		var rotateAddButton = function(pageId){
			var addBtn = pages[pageId].querySelector('svg[data-icon-name="add"]');
			if(addBtn){
				addBtn.classList.add("rotate");
				setTimeout(function(){addBtn.classList.remove("rotate");}, 1000);
			}
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

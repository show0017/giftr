String.prototype.repeat= function(n){
	    return Array(n+1).join(this);
}

var appClass = function(){

	var PAGE_LOADED_BIT_INDEX = 0;
	var DEVICE_READY_BIT_INDEX = 1;
	var MAXIMUM_NUMBER_OF_DISPLAYED_CONTACTS = 12;

	var pages = {};
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

		var init = function(){
			/* Load all svg images and set their tap event listeners. */
			var svgElementsArray = document.querySelectorAll("svg[data-icon-name]");
			for(var i=0; i<svgElementsArray.length; i++){
				var svgElement = svgElementsArray[i];
				load(svgElement,"data-icon-name");
			}
		}

		var load = function(svgElement,dataAttributeName){
			/* Get a reference to the embedded svg tag in the HTML document using Snap SVG*/
			var snapCanvas = Snap( svgElement );

			/* SVG tag must have a custom data set whose value matches SVG file name */
			var iconNameDataSet = svgElement.getAttribute(dataAttributeName);

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

		var loadForSelfDrawing = function(svgElement,dataAttributeName){
			/* Get a reference to the embedded svg tag in the HTML document using Snap SVG*/
			var snapCanvas = Snap( svgElement );

			/* SVG tag must have a custom data set whose value matches SVG file name */
			var iconNameDataSet = svgElement.getAttribute("data-icon-animate");

			/* Load SVG group content into HTML doc through snap svg library.
			Note that JS Closure must have been used because load method is asynchronous
			and snap svg canvas must be locked to load the vector graphic inside svg
			element correctly.*/
			Snap.load( "svg/"+iconNameDataSet+".svg", (function (myCanvas) {
				return function(fragment){
					var group = fragment.select( 'g' );

					var paths = fragment.selectAll("path");

					for(var i=0; i< paths.length; i++){
						var path = paths[i];

						var length = path.getTotalLength();

						path.attr({ "transition":"none",
									"WebkitTransition": "none",
									"strokeDasharray" : length + ' ' + length,
									"strokeDashoffset": length
								  });
					}

					myCanvas.append( group );
				} // return function
			})(snapCanvas)); //snap.load function
		}

		/* prepare svg animations that should happen in every page. */
		var prepareAnimation = function(svgName){
			switch(svgName){
				case "people":
					var svgPeople = document.querySelector('svg[data-icon-name="people"]');
					svgPeople.classList.add("hide");
					break;
				case "occasions":
					var svgOccasions = document.querySelector('svg[data-icon-name="occasions"]');
					svgOccasions.classList.add("hide");
					break;
				case "gift":
				// case "gifts-per-person":
					/* load special gift svgs whose path will be animated at run-time. */
					svgElementsArray = document.querySelectorAll('svg[data-icon-animate="gift"]');
					for(var i=0; i<svgElementsArray.length; i++){
						var svgElement = svgElementsArray[i];

						loadForSelfDrawing(svgElement,"data-icon-animate");
					} // for loop

					break;
				case "checkmark":

					/* load  checkmark svgs whose path will be animated at run-time. */
					var svgElementsArray = document.querySelectorAll('svg[data-icon-animate="checkmark"].unchecked');
					for(var i=0; i<svgElementsArray.length; i++){
						var svgElement = svgElementsArray[i];
						loadForSelfDrawing(svgElement,"data-icon-animate");
					}

					/* load checkmark svg that needn't any self-drawing*/
					var svgElementsArray = document.querySelectorAll('svg[data-icon-animate="checkmark"].checked');
					for(var i=0; i<svgElementsArray.length; i++){
						var svgElement = svgElementsArray[i];
						load(svgElement,"data-icon-animate");
					}

					break;
			}
		}

		/* start svg animations that should happen in every page. */
		var startAnimation = function(svgName){
			switch(svgName){
				case "people":
					var svgPeople = document.querySelector('svg[data-icon-name="people"]');
					svgPeople.classList.add("show");

					var leftPerson = document.querySelector('#left-person');
					var rightPerson = document.querySelector('#right-person');
					leftPerson.classList.add("pt-page-moveFromTop");
					rightPerson.classList.add("pt-page-moveFromBottom");

					setTimeout(function(){
						svgPeople.classList.remove("hide");
						svgPeople.classList.remove("show");

						leftPerson.classList.remove("pt-page-moveFromTop");
						rightPerson.classList.remove("pt-page-moveFromBottom");
					}, 600);
					break;

				case "occasions":
					var svgOccasions = document.querySelector('svg[data-icon-name="occasions"]');
					svgOccasions.classList.add("show");

					var ballonStrings = document.querySelectorAll('.string');
					for(var i=0; i<ballonStrings.length; i++)
						ballonStrings[i].classList.add("pt-page-moveFromBottom");
					var ballonUpperParts = document.querySelectorAll('.ballon-upper');
					for(var i=0; i<ballonUpperParts.length; i++)
						ballonUpperParts[i].classList.add("pt-page-moveFromTop");

					setTimeout(function(){
						svgOccasions.classList.remove("hide");
						svgOccasions.classList.remove("show");

						for(var i=0; i<ballonStrings.length; i++)
							ballonStrings[i].classList.remove("pt-page-moveFromBottom");
						for(var i=0; i<ballonUpperParts.length; i++)
							ballonUpperParts[i].classList.remove("pt-page-moveFromTop");
					}, 600);
					break;

				case "gift":
					 var svgGiftsArray = document.querySelectorAll('svg[data-icon-animate="gift"]');
					 for(var i=0; i< svgGiftsArray.length; i++){
					 	var svgGift = svgGiftsArray[i];
						 /* Set fill/stroke colors after ending animation. */
						 fireAnimation(svgGift, 2000 ,"hsl(69,54%,21%)", "#FFFFFF");
					 }

					break;
			}
		}

		var fireAnimation = function(svgTag, duration, fillColor, strokeColor){
			var paths = svgTag.querySelectorAll('path');
			for(var i=0; i< paths.length; i++){
				var path = paths[i];

				// Trigger a layout so styles are calculated & the browser
				// picks up the starting position before animating
				path.getBoundingClientRect();
				// Define our transition
				path.style.transition = path.style.WebkitTransition =
					'stroke-dashoffset 2s ease-in-out';
				// Go!
				path.style.strokeDashoffset = '0';

				changePathColors(path, duration, fillColor, strokeColor)();
			}
		}

		function changePathColors(myPath, duration, fillColor, strokeColor){
			return function(){
					setTimeout(function(){
						myPath.style.fill= fillColor;
						myPath.style.stroke = strokeColor;

						/* This is corner case for gifts icon*/
						if(("middle-vertical" == myPath.getAttribute("id")) ||
								 ("top-horizontal"  == myPath.getAttribute("id")) ){
								myPath.style.strokeWidth = "5.953";
						}
					},duration);
			};
		}

		var rotate = function(pageId){
			var addBtn  = pages[pageId].querySelector('svg[data-icon-name="add"]');
			var backBtn = pages[pageId].querySelector('svg[data-icon-name="back"]');
			if(addBtn){
				addBtn.classList.add("rotate");
				setTimeout(function(){addBtn.classList.remove("rotate");}, 600);
			}

			if(backBtn){
				backBtn.classList.add("rotate");
				setTimeout(function(){backBtn.classList.remove("rotate");}, 600);
			}
		}

		return{
				init: init,
				prepareAnimation: prepareAnimation,
				rotate: rotate,
				startAnimation: startAnimation,
				fireAnimation: fireAnimation,
				loadForSelfDrawing: loadForSelfDrawing
		}
	};

	var databaseClass = function(){
		var db;

		var connect = function(){
			db = window.openDatabase("giftrDB", "1.0", "Gifter Database", 1024000);
			createTables();
		}

		var createTables = function(){
			db.transaction( executeTablesCreateTransaction, transactionErrorCallback, transactionSuccessCallback );
		}

		var executeTablesCreateTransaction = function (trans){
		  trans.executeSql('CREATE TABLE IF NOT EXISTS people(person_id integer primary key autoincrement, person_name TEXT)');
		  trans.executeSql('CREATE TABLE IF NOT EXISTS occasions(occ_id integer primary key autoincrement, occ_name TEXT)');
		  trans.executeSql('CREATE TABLE IF NOT EXISTS gifts(gift_id integer primary key autoincrement, person_id INTEGER, occ_id INTEGER, gift_idea TEXT, purchased INTEGER DEFAULT 0)');
		}

		var transactionSuccessCallback = function(){
			console.log("transaction is completed successfully");
		}

		var transactionErrorCallback = function(error){
			console.error(error.message);
		}

		var getPrimaryKeyColumnName = function(table){
			var primaryColumn = null;
			switch(table){
				case "people":
					primaryColumn = "person_id";
					break;
				case "occasions":
					primaryColumn = "occ_id";
					break;
				case "gifts":
					primaryColumn = "gift_id";
					break;
				default:
					console.error("cant get primary key for unkown tbale");
			}
			return primaryColumn;
		}

		var getColumnsNames = function(table, contextId){
			var column = null;
			switch(table){
				case "people":
					column = ["person_name"];

					break;
				case "occasions":
					column = ["occ_name"];
					break;
				case "gifts":
					column = ["gift_idea"];
					column.push(contextId=="gifts-per-person"?"occ_name":"person_name");
					column.push("purchased");
					break;
				default:
					console.error("cant primary key for unkown tbale");
			}
			return column;
		}

		var loadData = function(table, uiCallback, keyId){
			var contextPage = this;
			db.transaction(transactionSelectAllCallback(contextPage, table, uiCallback, keyId) ,
			transactionErrorCallback,
			transactionSuccessCallback );
		}

		var transactionSelectAllCallback = function(contextPage, table, uiCallback, keyId){
			return function(trans){
				var primaryColumn = getPrimaryKeyColumnName(table);
				if("people"===table || "occasions" == table){
					var sqlStatement = 'SELECT * FROM '+ table +' ORDER BY '+ primaryColumn + ' DESC';
				}else{
					switch(contextPage.getAttribute("id")){
						case "gifts-per-person":

							var sqlStatement = 'SELECT g.gift_id, g.gift_idea, o.occ_name, g.purchased ';
							sqlStatement     +='FROM gifts AS g INNER JOIN occasions AS o ';
							sqlStatement     +='ON g.occ_id = o.occ_id ';
							sqlStatement     +='WHERE g.person_id = '+ keyId;
							sqlStatement     += ' ORDER BY g.gift_id DESC';

							break;
						case "gifts-per-occasion":
							var sqlStatement = 'SELECT g.gift_id, g.gift_idea, p.person_name, g.purchased ';
							sqlStatement     +='FROM gifts AS g INNER JOIN people AS p ';
							sqlStatement     +='ON g.person_id = p.person_id ';
							sqlStatement     +='WHERE g.occ_id = '+ keyId;
							sqlStatement     += ' ORDER BY g.gift_id DESC';

							break;
					}
			}
			trans.executeSql(sqlStatement,
							[],
							sqlSelectAllSuccessCallback(contextPage, table, uiCallback),
							sqlQueryErrorCallback);

			}
		}

		var sqlSelectAllSuccessCallback = function(contextPage, table, uiCallback){
			return function(trans, result){
				var primaryColumn = getPrimaryKeyColumnName(table);
				var columnNames = getColumnsNames(table, contextPage.getAttribute("id"));

				console.log("select all statement is completed successfully");
				var resultSet = [];
				for(var i=0; i< result.rows.length; i++){
					// console.log(result.rows.item(0));
					var obj = { "id"  : result.rows.item(i)[primaryColumn],
								"text":"" };
					for(var j=0; j< columnNames.length-2; j++){
						obj["text"] += result.rows.item(i)[columnNames[j]] + " - ";

					}
					obj["text"] += result.rows.item(i)[columnNames[j]];
					obj["purchased"] = result.rows.item(i)[columnNames[j+1]];
					resultSet.push(obj);
					// console.log(obj);
				}
				/* update corresponding listview. */
				uiCallback.call(contextPage, resultSet);
			}
		}

		var insertRow = function(table, newEntry, uiCallback){
			var contextPage = this;
			db.transaction(insertTransactionExecutionCallback(contextPage, table, newEntry, uiCallback) ,
			transactionErrorCallback,
			transactionSuccessCallback );
		}

		var insertTransactionExecutionCallback = function(contextPage, table, newEntry, uiCallback){

			return function(trans){
				var primaryColumn = getPrimaryKeyColumnName(table);

				var placeholder = '?,'.repeat(newEntry.length-1)+'?';
				var query = 'INSERT INTO '+ table +' VALUES(NULL,'+ placeholder+ ')';
				trans.executeSql(query,
								newEntry,
								function(trans, result){
									console.log("inserted id is:"+result.insertId);

									if("people"===table || "occasions" == table){

										var sqlStatement = 'SELECT * FROM '+ table +
											' WHERE '+primaryColumn +' = '+ result.insertId;
										console.log(sqlStatement);
									}else{

										switch(contextPage.getAttribute("id")){
											case "gifts-per-person":

												var sqlStatement = 'SELECT g.gift_id, g.gift_idea, o.occ_name ';
												sqlStatement     +='FROM gifts AS g INNER JOIN occasions AS o ';
												sqlStatement     +='ON g.occ_id = o.occ_id ';
												sqlStatement     +='WHERE g.person_id = '+newEntry[0];
												sqlStatement     += ' ORDER BY g.gift_id DESC';

												break;
											case "gifts-per-occasion":
												var sqlStatement = 'SELECT g.gift_id, g.gift_idea, p.person_name ';
												sqlStatement     +='FROM gifts AS g INNER JOIN people AS p ';
												sqlStatement     +='ON g.person_id = p.person_id ';
												sqlStatement     +='WHERE g.occ_id = '+newEntry[1];
												sqlStatement     += ' ORDER BY g.gift_id DESC';

												break;
										}

										console.log(sqlStatement);

									}

									trans.executeSql(sqlStatement,
													[],
													sqlInsertSuccessCallback(contextPage, table, uiCallback),
													sqlQueryErrorCallback);
								});
			}
		}

		var sqlInsertSuccessCallback = function(contextPage, table, uiCallback){
			return function(trans, result){
				console.log("insert statement is completed successfully");
				console.log("number of affected rows is: "+ result.rowsAffected);
				console.log(result.rows.item(0));

				var primaryColumn = getPrimaryKeyColumnName(table);
				var columnNames = getColumnsNames(table, contextPage.getAttribute("id"));


				/* format results */
				var textResult = "";

				for(var i=0; i<columnNames.length-2; i++){
					textResult += result.rows.item(0)[columnNames[i]] + " - ";
				}
				textResult += result.rows.item(0)[columnNames[i]];

				/* update corresponding listview. */
				uiCallback.call(contextPage,
								result.rows.item(0)[primaryColumn],
						    	textResult);
			}
		}

		var update = function ( table,
								columnName,
							  	rowId,
							  	uiCallback) {
			var context = this;
			db.transaction(updateTransactionCallback(context, table, columnName, rowId, uiCallback) ,
			transactionErrorCallback,
			transactionSuccessCallback );
		}


		var updateTransactionCallback = function(context, table, columnName, rowId, uiCallback){
			return function(trans){

				var primaryColumn = getPrimaryKeyColumnName(table);
				/* First select the table to check what is the current value of purchased state*/
				var sqlStatement = 'SELECT '+columnName+' FROM '+table+' WHERE '+ primaryColumn+' =?';
				trans.executeSql(sqlStatement,
								[rowId],
								function(trans, result){
									var currentPurchasedState = result.rows.item(0)[columnName];
									/* xor the value by 1 will toggle the value between 0 and 1. */
									var toggledPurchasedState = currentPurchasedState ^1;
									// console.log("********************************");
									// console.log(currentPurchasedState);
									// console.log(toggledPurchasedState);
									// console.log("********************************");

									var sqlStatement = 'UPDATE '+table+' SET '+columnName+' = ? WHERE '+primaryColumn+' = ?';
									trans.executeSql(sqlStatement,
													[toggledPurchasedState, rowId],
													/* NO need to query database again to retun updated value of purchased item, I already know it
													in the current function context, just pass it to update ui accordingly. */
													sqlUpdateSuccessCallback(context, toggledPurchasedState, uiCallback),
													sqlQueryErrorCallback);
								});
			}
		}

		var sqlUpdateSuccessCallback = function(context, toggledPurchasedState, uiCallback){
			return function(trans, result){
				uiCallback.call(context, toggledPurchasedState);
			}
		}

		var deleteRow = function (table,
							  	  rowId,
							  	  uiCallback) {
			var context = this;
			db.transaction(deleteTransactionCallback(context, table, rowId, uiCallback) ,
			transactionErrorCallback,
			transactionSuccessCallback );
		}

		var deleteTransactionCallback = function(context, table, id, uiCallback){
			return function(trans){
				var primaryColumn = getPrimaryKeyColumnName(table);

				if(table=="people" || table =="occasions"){
					var sqlStatement_1 = 'DELETE FROM '+table+' WHERE '+primaryColumn+' = ?';
					trans.executeSql(sqlStatement_1,[id]);
				}
				/* After deleting row from people/occasions table, make sure to delete the corresponding
				gift for the deleted person/occasion id.
				In case of deleting row from gifts table, only delete that entry, no need to do anything else.*/
				var sqlStatement = 'DELETE FROM gifts WHERE '+ primaryColumn +' = ?';
				trans.executeSql(sqlStatement,
								[id],
								sqlDeletionSuccessCallback(context, uiCallback),
								sqlQueryErrorCallback);

			}
		}

		var sqlDeletionSuccessCallback = function(context, uiCallback){
			uiCallback.call(context);
		}

		var sqlQueryErrorCallback = function(trans, error){
			console.error(error.message);
			/* TODO: Display error message to the user that insertion could not be done*/
		}

		return {
			connect: connect,
			loadData: loadData,
			insertRow: insertRow,
			update: update,
			deleteRow: deleteRow
		}
	}

	var siteNavigatorClass = function(){

		var numPages = 0;

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

			var currentPageId = document.URL.split("#")[1];
			switch(currentPageId){
				case "people":
				case "occasions":
					var inputText = document.getElementById("new-person-or-occasion");
					inputText.setAttribute("placeholder", "new "+(currentPageId=="people"?"person":"occasion"));
					inputText.value="";
					break;
				case "gifts-per-person":
				case "gifts-per-occasion":
					var inputText   = pages["add-gift"].querySelector("#new-gift-idea");
					inputText.setAttribute("placeholder", "new gift idea");
					inputText.setAttribute("value","");
					break;
				default:
					/*Do nothing*/
			}

			removeModalWindow();
		}

		var removeModalWindow = function(){
			var destPageId = document.URL.split("#")[1];
			var activeModal = document.querySelector('[data-role="modal"].pt-page-current');
			var currentPageId = activeModal.getAttribute("id");
			pages[currentPageId].classList.add("pt-page-moveToBottom");
			setTimeout(function(){
				pages[currentPageId].classList.remove("pt-page-current");
				pages[currentPageId].classList.remove("pt-page-moveToBottom");
			}, 600);
		}

		var handleSaveTap = function(ev){
			/* prevent page from reloading*/
			ev.preventDefault();

			var currentPageId = document.URL.split("#")[1];
			switch(currentPageId){
				case "people":
				case "occasions":
					var inputText = document.getElementById("new-person-or-occasion");
					if(inputText.value.trim()){
						database.insertRow.call(pages[currentPageId], //context of page whose id will be updated
												currentPageId, //database table name
											    [inputText.value.trim()], // new person or new occasion name
											    addEntryToListview); //ui callback
					}
					else{
						/* TDOD: Display wanring to the user that value cant be empty */
					}

					inputText.setAttribute("placeholder", "new "+(currentPageId=="people"?"person":"occasion"));
					inputText.value="";


					break;
				case "gifts-per-person":
				case "gifts-per-occasion":
					var personOrOccastionId = pages[currentPageId].querySelector(".page-internal-wrapper h2").getAttribute("data-ref");
					var inputText   = pages["add-gift"].querySelector("#new-gift-idea");
					var newGiftIdea = inputText.value.trim();
					var pickerList = pages["add-gift"].querySelector("#dropdwon-person-or-occasion");
					var selectedId = pickerList.options[pickerList.selectedIndex].value;

					console.log("personOrOccastionId is:"+personOrOccastionId);
					console.log("selectedId is:"+ selectedId);
					console.log("newGiftIdea is:"+ newGiftIdea);
					/* Make sure that user enters non empty string inside the gift idea and
					user selects any option other than default option that refers to "Choose Person/Occaion" */
					if(newGiftIdea && (0!=selectedId)){
						/* Make sure to pass gift idea, person id and occasion id in the correct order. */
						database.insertRow.call(pages[currentPageId],
											"gifts", //table name
											[//person_id, occ_id, gift_idea,
												"gifts-per-occasion"==currentPageId? selectedId: personOrOccastionId,
												"gifts-per-occasion"==currentPageId? personOrOccastionId: selectedId,
												newGiftIdea,
												0 // purchased value
											],
											addEntryToListview);
					}
					else{
						/* TDOD: Display wanring to the user that value cant be empty */
					}
					inputText.setAttribute("placeholder", "new gift idea");
					inputText.value="";

					break;
				default:
					/* Do nothing*/
			}

			removeModalWindow();
		}

		var handleDoubleTap = function(ev){
			var currentPageId = document.URL.split("#")[1];
			console.log("Double tap event has been recognized inside page:" + currentPageId);

			/* Get which list item that has been been double-tapped.*/
			var currentTarget = ev.target;
			var listItemId = currentTarget.getAttribute("data-ref");
			while(!listItemId){
				currentTarget = currentTarget.parentNode;
				listItemId = currentTarget.getAttribute("data-ref");
			}
			var listItem = currentTarget;

			// /* Make sure that we find a valid contanct list item */
			if(listItemId){
				/* remove item from listview and delete it from the database. */
				switch (currentPageId){
					case "people":
						var table = "people";
						break;
					case "occasions":
						var table = "occasions";
						break;
					case "gifts-per-person":
					case "gifts-per-occasion":
						var table = "gifts";
						break;
					default:
						return;
				}

				database.deleteRow.call(listItem, //context
									    table,
										listItemId, // primary id of the row that will be deleted
										deleteEntryFromListview
								);
			}

		}

		var handleSingleTap = function(ev){

			var currentPageId = document.URL.split("#")[1];
			console.log("Single tap event has been recognized inside page:"+currentPageId);

			/* A single tap on a list item in the People or Occasion screens will open the
			screen for managing the gifts for the selected person or occasion.*/

			/* A single tap on a gift idea will toggle the purchased status.*/

			/* Get which list item that has been tapped.*/
			var currentTarget = ev.target;
			var listItemId = currentTarget.getAttribute("data-ref");
			while(!listItemId){
				currentTarget = currentTarget.parentNode;
				listItemId = currentTarget.getAttribute("data-ref");
			}
			var listItem = currentTarget;

			/* Make sure that we find a valid list item */
			if(listItemId){
				switch (currentPageId){
					case "people":
						var destPageId = "gifts-per-person";
						/* load all gift ideas and occasion names for the given person*/
						database.loadData.call(siteNavigator.getPages()["gifts-per-person"],
						"gifts", //table name
						loadListview, //ui callback
						listItemId);
						break;
					case "occasions":
						var destPageId = "gifts-per-occasion";
						/* load all gift ideas and persons' names for the given occasion*/
						database.loadData.call(siteNavigator.getPages()["gifts-per-occasion"],
						"gifts", //table name
						loadListview, //ui callback
						listItemId);
						break;

						case "gifts-per-person":
						case "gifts-per-occasion":
							togglePurchaseState(listItem);
						return;
					default:
						/*Do nothing*/
				}

				var outClass = "pt-page-scaleDown";
				var inClass = "pt-page-scaleUp";

				var subHeader = pages[destPageId].querySelector('.page-internal-wrapper h2');
				subHeader.innerHTML = "Gifts for " + listItem.innerHTML;

				/* Set data-ref attribute for subheader as it is needed to insert new entry in gifts table*/
				subHeader.setAttribute("data-ref",listItemId);

				doPageTransition(currentPageId,destPageId,outClass,inClass,true);

			}else{
				console.error("Failed to find valid list item id");
			}
		}

		//Deal with history API and switching divs
		var doPageTransition = function( srcPageId, destPageId,
										 outClass, inClass,
										 isHistoryPush){

			if(srcPageId == null){
				//home page first call, load all entries from people and occasion tables
				pages[destPageId].classList.add("pt-page-current");
				pages[destPageId].classList.add("pt-page-fadeIn");

				svgIcons.prepareAnimation(destPageId); //destPageId has the same svg name "people"
				svgIcons.rotate(destPageId);

				setTimeout(function(){svgIcons.startAnimation(destPageId);}, 20);
				setTimeout(function(){
					pages[destPageId].classList.remove("pt-page-fadeIn");

				}, 1000); /* 1sec is the animation duration. */
				history.replaceState(null, null, "#"+destPageId);

			}else{

				pages[destPageId].classList.add("pt-page-current");
				pages[srcPageId].className  += " "+outClass;
				pages[destPageId].className += " "+inClass;

				if(("gifts-per-person" == destPageId) ||
					("gifts-per-occasion" == destPageId)){

					var mainSvgIcon = "gift";
				}else{
					var mainSvgIcon = destPageId;
				}

				svgIcons.prepareAnimation(mainSvgIcon);

				/* Get current styles for the destination page.*/
				var style = window.getComputedStyle(pages[destPageId], null);

				/* Get animation duration ( in millisecond )for the destination page.
				Remove last character which is 's' then parse the number*/
				var animationDuration = parseFloat(style.webkitAnimationDuration.slice(0,-1))* 1000;
				/* Get animation delay ( in millisecond ) for the destination page.*/
				var animationDelay = parseFloat(style.webkitAnimationDelay.slice(0,-1))* 1000;

				setTimeout(function(){
					/* Remove pt-page-current class and outClass from source page.
					Exception case: when displaying modal window, make sure to keep source page in the background*/
					pages[srcPageId].className = outClass?"":"pt-page-current";
					pages[destPageId].className = "pt-page-current";

					svgIcons.rotate(destPageId);
					svgIcons.startAnimation(mainSvgIcon);

				}, animationDuration + animationDelay); /* 0.6sec is the animation duration. */

				if (true === isHistoryPush)
					history.pushState(null, null, "#" + destPageId);
				else if(false === isHistoryPush)
					history.replaceState(null, null, "#"+destPageId);
			}/* else srcPageId is not null*/

			// currentPageId = destPageId;
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
				case "occasions":
					var destPageId = "add-person-or-occasion";
					var title = "New "+ (currentPageId=="people"?"Person":"Occasion");
					var placeHolder = "new "+(currentPageId=="people"?"person":"occasion");

					break;
				case "gifts-per-person":
				case "gifts-per-occasion":
					var destPageId = "add-gift";
					var subHeader = pages[currentPageId].querySelector('.page-internal-wrapper h2');
					/*  Get the name of the person or occasion.*/
					var re = /(Gifts for)\s+(.*)/;
					var personOrOccasionName = subHeader.innerHTML.match(re)[2];
					var title = "New Gift for "+ personOrOccasionName;
					var placeHolder = "new gift idea";
					var pickerList = pages["add-gift"].querySelector("#dropdwon-person-or-occasion");
					pickerList[0].text = "Choose "+(currentPageId=="gifts-per-person"?"Occasion":"Person");

					/* load all options from people/occasions table into picker list. */
					database.loadData.call( pages["add-gift"], //context of modal page
						(currentPageId=="gifts-per-person"?"occasions":"people"), //table name
					    loadPickerList); //ui callback

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

		var getPages = function(){
			return pages;
		}

		return {
					init : init,
					handleBackButton: handleBackButton,
					getPages: getPages
		}
	};

	var togglePurchaseState  = function(listItem){
		var listItemId = listItem.getAttribute("data-ref");
		// var svgCheckmark = listItem.querySelector('svg[data-icon-animate="checkmark"]');

		/* list item id refers to gift_id as well.
			First solution totally is dependent on database:
		    1. select purchase state from gifts table for the given gift id
			2. update the value in the table.
			3. update the ui by adding/removing checkmark svg.

			Second solution depends on js:
			1. Read checked property for input[checkbox] that exists inside llist item.
			2. toggle the checked property.
			3. update the database

			I will go with the first solution. */
		database.update.call( listItem, //context for both svg and
							  "gifts", //table name
							  "purchased", // column name
							  listItemId, //  gift_id whose value will be updated in the table.
							  updateCheckbox); //ui callback
		// svgIcons.fireAnimation(svgCheckmark, 600, "hsl(69,54%,21%)", "hsla(69, 100%, 73%, 0.93)");
	}

	/* This is a bit map that represents a bit for every events that is needed to be fired before
	using the app services in the device.
	There is a bit for DOMContentLoaded event and another bit for deviceready event.
	Create a new instance for bit map with value zero which means no events have been recieved yet. */
	var readyBitMap = new bitMapClass(0);
	var database = new databaseClass();
	var svgIcons = new svgClass();
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

		svgIcons.init();

		/*TODO: Remove the following line before final delivery of the app.*/
		if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
            console.debug("Running application from device");
       		/* Do nothing. */
        } else {
            console.debug("Running application from desktop browser");

			//connect to database
			database.connect();

			//add button and navigation listeners
			siteNavigator.init();

			//build the lists for the main pages based on data
			buildListviews();
        }

		onReady();
	}

	var onReady = function(){
		if(readyBitMap.isBitSet(DEVICE_READY_BIT_INDEX) &&
						readyBitMap.isBitSet(PAGE_LOADED_BIT_INDEX)){
			console.log("Both evenets have been fired");

			//connect to database
			database.connect();

			//add button and navigation listeners
			siteNavigator.init();

			//build the lists for the main pages based on data
			buildListviews();

		}else{
				console.log("Both evenets has not been fired yet");
		}
	}

	var onWindowResize = function(){
		console.log("Window resize event has been fired");
	}

	var buildListviews= function(){
		/* trigger database to select all rows in people table then load listview with returned result. */
		database.loadData.call( siteNavigator.getPages()["people"], //context of page
					"people", //table name
				    loadListview); //ui callback

		/* trigger database to select all rows in occasions table then load listview with returned result. */
		database.loadData.call( siteNavigator.getPages()["occasions"], //context of page
								"occasions", //table name
							    loadListview); //ui callback

		/* The other listviews (gifts per person/occasion) will be created once person/occasion item is tapped */

	}

	var updateCheckbox = function(purchasedState){
		var listItemContext = this;
		console.log("inside update checkbox: purchasedState = "+ purchasedState);
		var svgCheckmark = listItemContext.querySelector('svg[data-icon-animate="checkmark"]');
		if(1==purchasedState){
			console.log("item has been purchased");
			svgIcons.fireAnimation(svgCheckmark, 600, "hsl(69,54%,21%)", "hsla(69, 100%, 73%, 0.93)");

		}else{
			console.log("*************** item has not been purchased yet");
			//remove the checkmark and reload svg to be ready to be self-drawn if clicked again.
			svgCheckmark.querySelector('g').remove();
			svgIcons.loadForSelfDrawing(svgCheckmark,"data-icon-animate");
		}


		svgCheckmark.classList.toggle("checked");
		svgCheckmark.classList.toggle("unchecked");

	}

	var loadListview = function(result){
		var contextPage = this;
		var listView = contextPage.querySelector('[data-role="listview"]');
		var listOfItems = "";
		var pageId = contextPage.getAttribute("id");
		for(var i=0; i< result.length; i++){
			listOfItems += '<li class="';
			listOfItems += 'horizontal-align" ';
			listOfItems += 'data-ref="';
			listOfItems += result[i].id +'" >';

			/* Add checkbox in case page context gifts per person/occasion. It will be used for visual representation. */
			if( pageId == "gifts-per-person" ||
				pageId == "gifts-per-occasion"){
				listOfItems += '<input id="cb'+result[i].id+ '" name="cb'+result[i].id+'" type="checkbox"><label for="cb'+result[i].id+'">';
			}

			listOfItems += result[i].text; // it represents value of person_name, occ_name
			if( pageId == "gifts-per-person" ||
				pageId == "gifts-per-occasion"){
				listOfItems += '</label>';
				listOfItems += '<svg data-icon-animate="checkmark" viewBox="0 0 48 48"';
				// console.log(result[i].purchased);
				if(1 == result[i].purchased)
					listOfItems += 'class="checked"';
				else
					listOfItems += 'class="unchecked"';

				listOfItems +='></svg>';
			}

			listOfItems += "</li>"
		}

		listView.innerHTML = listOfItems;
		svgIcons.prepareAnimation("checkmark");
	}

	var addEntryToListview = function(dataRef, text){
		/*  Any list item in any screen will have the following html format:
			<li data-ref="1" class="horizontal-align pt-page-moveFromTop">person 1</li>
			where data-ref is the element id in the corresponding database
		*/
		var contextPage = this;
		var listView = contextPage.querySelector('[data-role="listview"]');
		var pageId = contextPage.getAttribute("id");

		var newListItem = document.createElement("li");
		newListItem.className = "horizontal-align pt-page-moveFromTop";
		var liString ="";
		/* Add checkbox in case page context gifts per person/occasion. It will be used for visual representation. */
		if( pageId == "gifts-per-person" ||
			pageId == "gifts-per-occasion"){
			liString += '<input id="cb'+ dataRef + '" name="cb'+ dataRef+'" type="checkbox"><label for="cb'+dataRef+'">';
		}
		liString += text;

		if( pageId == "gifts-per-person" ||
			pageId == "gifts-per-occasion"){
			liString += '</label>';
			liString += '<svg data-icon-animate="checkmark" viewBox="0 0 48 48" class="unchecked"></svg>'
		}

		newListItem.innerHTML = liString;
		newListItem.setAttribute("data-ref", dataRef);

		var topListItem = listView.querySelector('li');
		if(topListItem)
			listView.insertBefore(newListItem,topListItem);
		else
			listView.appendChild(newListItem);

		svgIcons.prepareAnimation("checkmark");
	}

	var loadPickerList = function(result, name){
		/*  Any option in picker list will have the following html format:
			<option value="x">Person/Occasion Name</option>
			where x referes to the person/occasion id in the corresponding database.
		*/

		var contextPage = this;
		var pickerList = contextPage.querySelector("#dropdwon-person-or-occasion");

		var listOfOptions = pickerList.querySelector('option[value="0"]').outerHTML;
		for(var i=0; i<result.length; i++){
			listOfOptions += '<option value="';
			listOfOptions += result[i].id;
			listOfOptions += '">';
			listOfOptions += result[i].text;
			listOfOptions += '</option>';
		}

		pickerList.innerHTML = listOfOptions;
	}

	var deleteEntryFromListview = function(){
		var listItemContext = this;
		listItemContext.classList.add("pt-page-moveToLeft");
		setTimeout(function(){
			listItemContext.remove();
		},600);
	}

	return {
				init: init
	}
};

var show0017 = new appClass();
show0017.init();

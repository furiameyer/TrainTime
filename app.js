// Run this first
$(document).ready(function () {

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyA7K6tcV0FZsQxaztM8TxEauHjX7eLDZkg",
    authDomain: "homework-ahm.firebaseapp.com",
    databaseURL: "https://homework-ahm.firebaseio.com",
    projectId: "homework-ahm",
    storageBucket: "homework-ahm.appspot.com",
    messagingSenderId: "463414555489"
  };
  firebase.initializeApp(config);

  // Create a variable to reference the database
  var database = firebase.database();

  // Create a counter to determine number of records in database (used for updating next train times)
  var recordCounter = 0;

  // Create global variables to be used later
  var updateInfoInterval;
  var nextArrival;
  var nextArrivalClean;
  var minutesAway;
  var nextDay;

  // Tracks activity in Submit button
  $("#add-train-btn").on("click", function(event) {
    event.preventDefault();
  
    // Grabs user input
    var trainName = $("#train-name-input").val().trim();
    var destination = $("#destination-input").val().trim();
    var firstTrain = $("#first-train-input").val().trim();
    var frequency = $("#frequency-input").val().trim();
    
    // Creates local "temporary" object for holding employee data
    var newTrain = {
      name: trainName,
      dest: destination,
      first: firstTrain,
      freq: frequency
    };
  
    // Uploads train data to the database
    console.log(newTrain);
    database.ref().push(newTrain);
  
    // Alert
    alert("Train successfully added");
  
    // Clears all of the text-boxes
    $("#train-name-input").val("");
    $("#destination-input").val("");
    $("#first-train-input").val("");
    $("#frequency-input").val("");
  });
  
  // 3. Create Firebase event for adding a row in the html when a user adds an entry
  database.ref().on("child_added", function(trainSnapshot) {

    // Adds to counter
    recordCounter++;
    console.log(recordCounter);
  
    // Validate pull from Firebase
    console.log(trainSnapshot.val());
  
    // Store everything into a variable.
    var trainName = trainSnapshot.val().name;
    var destination = trainSnapshot.val().dest;
    var firstTrain = trainSnapshot.val().first;
    var frequency = trainSnapshot.val().freq;
  
    // Calculate next arrival and minutes away
    dynamicValues (firstTrain,frequency);

    // Create a new table row element
    // ------------------------------
    var createRow = function() {

      var tRow = $("<tr>");
      tRow.attr("id", "table-row-" + recordCounter);

      // generates table data for the row and sets up trackers required for the dynamic variables
      var trainNameTbl = $("<td>").text(trainName);
      var destinationTbl = $("<td>").text(destination);

      var frequencyTbl = $("<td>").text(frequency);
      frequencyTbl.attr("data-frequency", frequency);
      frequencyTbl.attr("data-firstTrain", firstTrain);
      frequencyTbl.attr("id", "recordNr-" + recordCounter);

      var nextArrivalTbl = $("<td>").text(nextArrivalClean);
      nextArrivalTbl.attr("id", "arrival-" + recordCounter);

      var minutesAwayTbl = $("<td>").text(minutesAway);
      minutesAwayTbl.attr("id", "minutes-away-" + recordCounter);

      // Append the newly created table data to the table row
      tRow.append(trainNameTbl,destinationTbl,frequencyTbl,nextArrivalTbl,minutesAwayTbl);
      // Append the table row to the table body
      $("#currentTrainSchedule").append(tRow);
    };

    createRow();

    // Kickoff dynamic info updates
    clearPastIntervals();
    newInterval();

  });

  // This set of functions create functionality to update train times every second
  // -----------------------------------------------------------------------------
  function clearPastIntervals () {
    clearInterval(updateInfoInterval);
  };

  function newInterval () {
    updateInfoInterval = setInterval(autoInfoUpdate,1000);
  };

  function autoInfoUpdate () {
    for (var i=1; i<recordCounter+1; i++) {
      var frequency = $("#recordNr-" + i).attr("data-frequency");
      var firstTrain = $("#recordNr-" + i).attr("data-firstTrain");
      dynamicValues (firstTrain,frequency);
      $("#arrival-" + i).text(nextArrivalClean);
      $("#minutes-away-" + i).text(minutesAway);
      
      // if next train is within 5 minutes, the entire row shows up red
      if (minutesAway<6) {
        $("#table-row-" + i).addClass("table-danger");
      } else {
        $("#table-row-" + i).removeClass();
      };
    };
  };

  // This function calculates values for nextTrain and minutesAway
  // -------------------------------------------------------------
  function dynamicValues (firstTrain,frequency) {
    //resets boolean
    nextDay = false;
    
    // creates a moment object from user input
    var firstTrainMoment = moment(firstTrain, 'HH:mm');

    // sets up a boolean test to assess if NOW is before the first train departing in the day
    var before = moment().isBefore(firstTrainMoment);

    // calculates the next train count
    var nextTrainCount = Math.floor(moment().diff(firstTrainMoment, 'minutes')/frequency) + 1;

    // defines total minutes between next train and first train - this help calculate the time of next train 
    var nextTrainDelta = nextTrainCount * frequency

    // creates a variable used for determining if next train takes place the following day
    var endOfDay = moment().endOf("day");

    // If NOW is before the first train, then next arrival is the first train departing in the day
    if (before) {
      nextArrival = firstTrainMoment;

      // if between train intervals, next arrival happens at the next available train interval, unless...
    } else {
        nextArrival = firstTrainMoment.clone().add(nextTrainDelta, 'minutes');

        // ... next train interval takes place the next day, in which case the next arrival happens at the time of the first train departing in the day
        if (nextArrival.isAfter(endOfDay)) {
          nextArrival = firstTrainMoment.clone().add(1, 'd');
          nextDay = true;
      };
    };

    // cleans up next arrival format and adds flag if next arrival happens the following day
    nextArrivalClean = nextArrival.format('h:mm A');
    if (nextDay) {
      nextArrivalClean = nextArrivalClean + " (+1d)";
    };

    // calculates minutes away for next arrival
    minutesAway = nextArrival.diff(moment(), 'minutes');
  };
});

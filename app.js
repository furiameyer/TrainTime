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

  //resets boolean used later
  var nextDay = false
 
  // Validate pull from Firebase
  console.log(trainSnapshot.val());
 
  // Store everything into a variable.
  var trainName = trainSnapshot.val().name;
  var destination = trainSnapshot.val().dest;
  var firstTrain = trainSnapshot.val().first;
  var frequency = trainSnapshot.val().freq;
 
  // Train info pulled from Firebase
  console.log("from database " + trainName);
  console.log("from database " + destination);
  console.log("from database " + firstTrain);
  console.log("from database " + frequency);
 
  // Calculate Next Arrival HERE
  // ---------------------------
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
    var nextArrival = firstTrainMoment;
    console.log("if 1");

    // if between train intervals, next arrival happens at the next available train interval, unless...
  } else {
      var nextArrival = firstTrainMoment.clone().add(nextTrainDelta, 'minutes');
      console.log("if 2");
      console.log(nextArrival);

      // ... next train interval takes place the next day, in which case the next arrival happens at the time of the first train departing in the day
      if (nextArrival.isAfter(endOfDay)) {
        nextArrival = firstTrainMoment.clone().add(1, 'd');
        nextDay = true;
        console.log("if 3");
      };
    };
  
  // Calculate minutes Away HERE
  // ---------------------------
  var minutesAway = nextArrival.diff(moment(), 'minutes');

  // Create a new table row element
  var createRow = function() {

    var tRow = $("<tr>");

    // if next train is within 5 minutes, the entire row shows up red
    if (minutesAway<6) {
      tRow.addClass("table-danger");
    };
    
    // pulls time in milotary format from next arrival moment object
    var nextArrival24H = nextArrival.format('HH:mm');
    if (nextDay) {
      nextArrival24H = nextArrival24H + " (+1d)";
    }

    // generates table data for the row
    var trainNameTbl = $("<td>").text(trainName);
    var destinationTbl = $("<td>").text(destination);
    var frequencyTbl = $("<td>").text(frequency);
    var nextArrivalTbl = $("<td>").text(nextArrival24H);
    var minutesAwayTbl = $("<td>").text(minutesAway);

    // Append the newly created table data to the table row
    tRow.append(trainNameTbl,destinationTbl,frequencyTbl,nextArrivalTbl,minutesAwayTbl);
    // Append the table row to the table body
    $("#currentTrainSchedule").append(tRow);
  };

  createRow();

 });
});

/*************************************************************************
 * SCC330 Network Studio - Team 2 - JALP SmartLab
 *
 *************************************************************************
 *
 * @author
 * Anson Cheung
 * Josh Stennett
 *************************************************************************/

//modules
var spotApp = angular.module('spotApp', ['ngRoute', 'ngResource', 'firebase', 'googlechart', 'ngDialog', 'ngDraggable']);
var ref = new Firebase("https://sunsspot.firebaseio.com");
var spotSettingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");

//Routes
spotApp.config(function($routeProvider, $locationProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/smartlab.html',
            controller: 'smartlabController'
        })
        .when('/mapTest', {
            templateUrl: 'pages/mapTest.html',
            controller: 'mapController'
        })
        .when('/map', {
            templateUrl: 'pages/mapTest.html',
            controller: 'mapTestController'
        })
        .when('/history', {
            templateUrl: 'pages/history.html',
            controller: 'historyController'
        })
        .otherwise({
            redirectTo: '/'
        });

});

//Think it as global variables
spotApp.run(function($rootScope, $firebaseObject) {


    $rootScope.appName = 'JALP SmartLab';

    $rootScope.livedata = $firebaseObject(ref.child('zone1').limitToLast(1));
    $rootScope.livedata2 = $firebaseObject(ref.child('zone2').limitToLast(1));
    $rootScope.livedata3 = $firebaseObject(ref.child('zone3').limitToLast(1));

    $rootScope.zone1hourly = $firebaseObject(ref.child('zone1hourly'));
    $rootScope.zone2hourly = $firebaseObject(ref.child('zone2hourly'));
    $rootScope.zone3hourly = $firebaseObject(ref.child('zone3hourly'));

    /**
     * Set chart options
     * @param {String} chartType - Could be Gauge or {..haven't implemented other graph options}
     * @param {object} chartObject
     * @param {String} type = Could be either 'light' or 'temp'(Temperature)
     * @author Anson Cheung
     */
    $rootScope.setChart = function(chartType, chartObject, type) {

        chartObject.type = chartType;

        if (type === 'light') {
            chartObject.options = {
                max: 3000,
                width: 400,
                height: 120,
                yellowFrom: 1000,
                yellowTo: 1500,
                redFrom: 1500,
                redTo: 3000,
                minorTicks: 5,
                animation: {
                    duration: 1000,
                    easing: 'out',
                }
            };
        }
        if (type === 'temp') {
            chartObject.options = {
                max: 60,
                width: 400,
                height: 120,
                yellowFrom: 20,
                yellowTo: 40,
                redFrom: 40,
                redTo: 60,
                minorTicks: 5,
                animation: {
                    duration: 1000,
                    easing: 'out',
                }
            };
        }

    }

    /**
       * Listens to the objects
       * @param {type} paramName - Description.
       * @author Anson Cheung
       */
    $rootScope.listenLive = function(childName, object, type) {
        ref.child(childName).limitToLast(1).on('child_added', function(snapshot) {
            var data = snapshot.val();
            var light = Math.round(data.light * 100) / 100; //Round up to 2 decimal places
            var temp = Math.round(data.temp * 100) / 100; //Round up to 2 decimal places

            if (type === 'light') {
                object.data = [
                    ['Label', 'Value'],
                    ['Light (lm)', light]
                ];
            }

            if (type === 'temp') {
                object.data = [
                    ['Label', 'Value'],
                    ['Temp (℃)', temp]
                ];
            }
        });
    }

    /**
       * DESCRIPTION
       * @param {type} paramName - Description.
       * @author Anson Cheung
       */
    $rootScope.pushData = function(childName, object, type) {
        ref.child(childName).on("value", function(snapshot) {
            snapshot.forEach(function(data) {
                var timestamp = new Date(data.val().timestamp);

                if (type === 'light') {
                    object.data.rows.push({
                        c: [{
                            v: new Date(timestamp)
                        }, {
                            v: data.val().light
                        }, ]
                    });
                }

                if (type === 'temp') {
                    object.data.rows.push({
                        c: [{
                            v: new Date(timestamp)
                        }, {
                            v: data.val().temp
                        }, ]
                    });
                }

            });
        });
    }



    /*----- LIVE DATA PAGE -----*/
    var liveZoneLight = [];
    var liveZoneTemp = [];

    for (i = 0; i < 3; i++) {

        //Light
        liveZoneLight[i] = {};
        $rootScope.setChart('Gauge', liveZoneLight[i], 'light');
        $rootScope.listenLive('zone' + (i + 1), liveZoneLight[i], 'light');

        //Temperature
        liveZoneTemp[i] = {};
        $rootScope.setChart('Gauge', liveZoneTemp[i], 'temp');
        $rootScope.listenLive('zone' + (i + 1), liveZoneTemp[i], 'temp');

    }

    //Zone 1 Light & Temp
    $rootScope.liveLight1 = liveZoneLight[0];
    $rootScope.liveTemp1 = liveZoneTemp[0];

    //Zone 2 Light & Temp
    $rootScope.liveLight2 = liveZoneLight[1];
    $rootScope.liveTemp2 = liveZoneTemp[1];

    //Zone 3 Light & Temp
    $rootScope.liveLight3 = liveZoneLight[2];
    $rootScope.liveTemp3 = liveZoneTemp[2];


    /*----- HISTORY PAGE -----*/
    var zoneLight = [];
    var zoneTemp = [];

    for (i = 0; i < 3; i++) {
        //Zone's light
        zoneLight[i] = {};

        zoneLight[i].type = "AnnotationChart";

        zoneLight[i].data = {
            "cols": [{
                id: "week",
                label: "Week",
                type: "date"
            }, {
                id: "light-data",
                label: "Light (lm)",
                type: "number"
            }],
            "rows": []
        };

        $rootScope.pushData('zone' + (i + 1) + 'hourly', zoneLight[i], 'light');

        zoneLight[i].options = {
            displayAnnotations: true,
            zoomButtonsOrder: ['1-hour', 'max'],
            height:400
        };

        //Zone's Temperature
        zoneTemp[i] = {};

        zoneTemp[i].type = "AnnotationChart";

        zoneTemp[i].data = {
            "cols": [{
                id: "week",
                label: "Week",
                type: "date"
            }, {
                id: "temp-data",
                label: "Temp (℃)",
                type: "number"
            }],
            "rows": []
        };

        $rootScope.pushData('zone' + (i + 1) + 'hourly', zoneTemp[i], 'temp');

        zoneTemp[i].options = {
            displayAnnotations: true,
            zoomButtonsOrder: ['1-hour', 'max'],
            colors: ['#FF0000', '#FF0000', '#FF0000'],
            height:400
        };
    }

    $rootScope.zone1light = zoneLight[0];
    $rootScope.zone2light = zoneLight[1];
    $rootScope.zone3light = zoneLight[2];

    $rootScope.zone1temp = zoneTemp[0];
    $rootScope.zone2temp = zoneTemp[1];
    $rootScope.zone3temp = zoneTemp[2];

    //-----------------------------------//
    //############# TESTING #############//
    //########## DONT DELETE ############//
    //-----------------------------------//
    // var liveLightTest = {};
    // liveLightTest.type = "AnnotationChart";

    // liveLightTest.data = {
    //     "cols": [{
    //         id: "week",
    //         label: "Week",
    //         type: "date"
    //     }, {
    //         id: "value-data",
    //         label: "Value",
    //         type: "number"
    //     }],
    //     "rows": []
    // };

    // spotTest.on('child_added', function(snapshot) {
    //     var data = snapshot.val();
    //     var timestamp = new Date(data.timestamp);

    //     liveLightTest.data.rows.push({
    //         c: [{
    //             v: new Date(timestamp)
    //         }, {
    //             v: data.newVal
    //         }, ]
    //     });


    // });

    // liveLightTest.options = {
    //     displayAnnotations: false,
    //     zoomButtonsOrder: ['1-hour', 'max'],
    //     colors: ['#00FF00', '#00FF00', '#00FF00']
    // };

    // $rootScope.liveLightTest = liveLightTest;
    //-----------------------------------//
    //########### TESTING END ###########//
    //########## DONT DELETE ############//
    //-----------------------------------//

})


//smart lab Controller
spotApp.controller('smartlabController', ['$rootScope', '$scope', '$interval', '$timeout', '$firebaseObject', '$parse', 'ngDialog',
function($rootScope, $scope, $interval, $timeout, $firebaseObject, $parse, ngDialog) {

    $scope.playbackHours = [ 
        {code : 1, hour: '1 hour'}, 
        {code : 5, hour: '5 hours'}, 
        {code : 24, hour: '24 hours'} ,
        {code : 168, hour: '1 week'} 
    ];

    $scope.selected = $scope.playbackHours[0];

    $scope.playbackSpeed = [ 
        {code : 1, speed: '1x'}, 
        {code : 2, speed: '5x'}, 
        {code : 5, speed: '20x'} ,
        {code : 10, speed: '100x'} 
    ];

    $scope.selectedSpeed = $scope.playbackSpeed[0];
    
    $scope.loadHistory = function(){

        //Retrieve opened sensor values
        var spotAddress = $('#historyPlayback').find('#spotAddress')[0].innerHTML
        var hours =  $scope.selected.code;
        var hoursMilli = hours * 3600000;
        var curDate = new Date();
        curDate = Date.now();

        $scope.speed = $scope.selectedSpeed.code;
        $scope.index = 0;

        // Get a reference for our log
        var ref = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + spotAddress + "/zone");
        
        $scope.ref = [];
        $scope.history = [];

        var j = 0;

        ref.on('child_added', function(snapshot, prevChildKey) {
            var data = snapshot.val();

            //Set range of selected data
            if(data.timestamp >= (curDate - hoursMilli)){
                $scope.ref[j] = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + spotAddress + "/zone/" + snapshot.key());
                $scope.history[j] = $firebaseObject($scope.ref[j]);
                j++;
            }

        });
    }
    
    var promise;

    $scope.play = function(length){
        console.log("play buttion pressed.");
        
        promise = $interval(function(){
                        if($scope.index < length){
                            $scope.index++;
                        }else{
                            $scope.stop();
                        }
                    }, 1000 / $scope.speed);

    }

    $scope.stop = function(){
        $interval.cancel(promise);
        promise = $timeout(function(){
            console.log("Stopped.");
        }, 1000);
    }

    $scope.changeSpeed = function(length){
        $scope.speed = $scope.selectedSpeed.code;
        console.log("FPS: " + $scope.speed);
        $scope.stop();
        $scope.play(length);
    }

    $scope.forward = function(length){
        if($scope.index < length){
            $scope.index++;
            console.log($scope.history[$scope.index]);
        }
    }

    $scope.backward = function(length){
        if($scope.index > 0 && $scope.index < length){
            $scope.index--;
            console.log($scope.history[$scope.index]);
        }
    }

    $scope.restart = function(){
        $scope.index = 0;
    }

    $scope.clear = function(){
        console.log("Clearing...");
        $scope.index = 0;
        $scope.ref = [];
        $scope.history = [];
        $scope.selected = $scope.playbackHours[0];
        $scope.selectedSpeed = $scope.playbackSpeed[0];
    }


    /**
     * Generate a annotation graph and set it to a <div>
     * @constructor
     * @param {int} zoneNumber - Zone number.
     * @param {String} graphType - Either 'light' or 'temp'.
     * @param {string} bindDivName - The author of the book.
     * @author Anson Cheung & Josh Stennett
     */
    $scope.setHistoryChart = function(zoneNumber, graphType, bindDivName){
      console.log("setHistoryChart received bindDivName as: " + bindDivName);
        // google.load("visualization", "1", {packages:["annotationchart"]});
        //google.setOnLoadCallback(drawChart);
        var data = new google.visualization.DataTable();
        data.addColumn('date', 'Date');

        if(graphType==='light'){
            data.addColumn('number','Light (lm)');
        }else{
            data.addColumn('number', 'Temperature (℃)');
        }

        // Get a reference to our logs
        var ref = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber + "hourly");

        // Retrieve new logs as they are added to our database
        ref.on("child_added", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();

            if(graphType==='light'){
                data.addRow([new Date(newLog.timestamp),newLog.light]);
            }else{
                data.addRow([new Date(newLog.timestamp),newLog.temp]);
            }

            //google.setOnLoadCallback(drawChart);

            drawChart(bindDivName);
        });

        var ref2 = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber);
        ref2.limitToLast(180).once("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            for (var log in newLog){
                if(graphType==='light'){
                    data.addRow([new Date(newLog[log].timestamp),newLog[log].light]);
                }else{
                    data.addRow([new Date(newLog[log].timestamp),newLog[log].temp]);
                }
            }


            drawChart(bindDivName);
        });

        function drawChart(bindDivName) {
                  console.log("drawing chart to : " + bindDivName);
                  console.log($("#"+bindDivName)[0]);
                  console.log(document.getElementById(bindDivName));
          var chart = new google.visualization.AnnotationChart($("#"+bindDivName)[0]);

          var options = {
            displayAnnotations: true,
            zoomButtons:{
                  '1m': { 'label': '1m', 'offset': [0, 1, 0] },
                  '15m': { 'label': '15m', 'offset': [0, 15, 0] },
                  '1h': { 'label': '1h', 'offset': [1, 0, 0] },
                  '6hs': { 'label': '6h', 'offset': [6, 0, 0] },
                  '1d': { 'label': '1d', 'offset': [1, 0, 0, 0, 0]},
                  '5d': { 'label': '5d', 'offset': [5, 0, 0, 0, 0] },
                  '1w': { 'label': '1w', 'offset': [7, 0, 0, 0, 0] },
            },
            zoomButtonsOrder: ['1m', '15m', '1h', '6h', '1d', '5d', '1w', 'max'],
          };

          options.colors = graphType=='light' ? ['#0D47A1', '#0D47A1', '#0D47A1'] : ['#880E4F', '#AD1457', '#C2185B'];

          chart.draw(data, options);
        }
    }

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Anson Cheung & Josh Stennett
   */
  $scope.init = function() {

    //Bind graphs to zone(zoneNumber)light/temp.
    //  $scope.setHistoryChart(i, 'light', 'zone1light');

  /*  for(i=1;i<=3;i++){
        $scope.setHistoryChart(i, 'light', 'zone' + i + 'light');
        $scope.setHistoryChart(i, 'temp', 'zone' + i + 'temp');


    }*/

    /**
     * Generate a sparkline and set it to a <div>
     * @constructor
     * @param {int} zoneNumber - Zone number.
     * @param {String} sensorType - Name of the sensor Type.
     * @return {sparkline Object} - This returns the line chart object and you can call it in HTML
     * HTML: <div google-chart chart="sparkline(int ZoneNumber, String sensorType)" style="height:50px;cursor:pointer;"></div>
     * @author Anson Cheung & Josh Stennett
     */
    $scope.sparkline = function(zoneNumber, sensorType, color){
        var zoneRef = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber);

        var sparkline = {};
        sparkline.type = "LineChart";


        sparkline.data = {
            "cols": [
                {id: "number",label: "number", type: "date"},
                {id: "value-data",label: "Value", type: "number"
            }],
            "rows": []
        };


        zoneRef.limitToLast(30).on('child_added', function(snapshot) {
            var data = snapshot.val();
            var timestamp = new Date(data.timestamp);

            switch(sensorType){
                case 'light':
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.light}]});
                    break;
                case 'temp':
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.temp}, ]});
                    break;
                default:
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.light}]});
            }

        });

        sparkline.options = {
            hAxis: {
              textPosition: 'none'
            },
            vAxis: {
              textPosition: 'none'
            },
            legend: {position: 'none'},
            lineWidth: 1,
            lineHeight: 1,
            enableInteractivity: false
        };

        switch(color){
            case 'blue':
                sparkline.options.colors = ['#0D47A1', '#0D47A1', '#0D47A1'];
                break;
            case 'red':
                sparkline.options.colors = ['#880E4F', '#AD1457', '#C2185B'];
                break;
            default:
                sparkline.options.colors = ['#000', '#000', '#000'];
        }

        return sparkline;
    }


    /**
     * DESCRIPTION
     * @author Josh Stennett, Liam cottier
     */
      $scope.fillArray = function(){
        var spotAddress = $('#historyPlayback').find('#spotAddress')[0].innerHTML
        var hours =  $('#playbackHours').val()
        var speed = $('#playbackSpeed').val()
          console.log("spotAddress " + spotAddress);
          console.log("hours " + hours);
          console.log("speed " + speed);
          var ref = new Firebase("https://sunsspot.firebaseio.com/spotReadings/"+spotAddress+"/zone");
          var zoneArray = new Array();
          var hoursMilli = hours * 3600000;
          console.log(hoursMilli);
          var curDate = new Date();
          curDate = Date.now();

          // dataTable code
          var data = new google.visualization.DataTable();
          data.addColumn('string', 'Zone');
          data.addColumn('datetime', "Time entered zone");
          data.addColumn('datetime', "Time exit zone");

          ref.on("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            var oldLog = null;
            for (var log in newLog){
              if (oldLog != null){
                if(newLog[log].timestamp >= (curDate - hoursMilli)){
                    data.addRow([newLog[oldLog].newVal.toString(), new Date(newLog[oldLog].timestamp), new Date(newLog[log].timestamp)])
                }
              }


              oldLog = log;
            }
            var timeline = new google.visualization.Timeline(document.getElementById('timeline_div'));

            timeline.draw(data, {width: '100%', height: '100%'});

            var table = new google.visualization.Table(document.getElementById('table_div'));

            table.draw(data, {width: '100%', height: '100%'});
          });


/* Animation code
          ref.on("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            console.log(curDate);
            console.log(hoursMilli);
            for (var log in newLog){
              if(newLog[log].timestamp >= (curDate - hoursMilli))
                zoneArray.push(newLog[log]);

            }
            $scope.playback(zoneArray, speed);

          });
*/

        }

        /**
         * DESCRIPTION
         * @author  Liam cottier
         */
        $scope.playback = function(zoneArray,speed){
          console.log(zoneArray.length);
          for(i = 0; i<zoneArray.length;i++){
          //  var waitTime = (zoneArray[(i+1)].timestamp -zoneArray[i].timestamp)/speed
            //console.log("logging : " + zoneArray[i].newVal + " to: " + "#playbackZone"+zoneArray[i].newVal + " at array index: " + i);
            $scope.pause(10);

            $("#playbackZone"+zoneArray[i].newVal).append(zoneArray[i].newVal);
            console.log("appended");
          }
        }
        /**
         * DESCRIPTION
         * @author  Liam cottier
         */
        $scope.pause = function(millis)
        {
          var date = new Date();
          var curDate = null;

          do { curDate = new Date(); }
          while(curDate-date < millis);
        }

        /**
         * DESCRIPTION
         * @author Josh Stennett
         */
    function createSensor(snapshot, pageElement){

      //all of this applies to both person sensors && non-person sensors

      $(pageElement).find("#spotName")[0].innerHTML = snapshot.name; //insert the spot name
      $(pageElement).find("#spotMAC")[0].innerHTML = snapshot.address; //insert the spot name
      $(pageElement).find("#locationHistoryBtn").data('address', snapshot.address);


      var batteryElement =  $(pageElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));

      if(!snapshot.alive){ //set the status light to red if the sensor is not alive.
        var status = $(pageElement).find("#status");
        $(status).css('background-color','darkred');
      }

      if(snapshot.task.indexOf("p") === -1){ //new sensor is not a person sensor
        //console.log("Creating new sensor!");
        //console.log(snapshot);
        var spotTask = $(pageElement).find("#spotTask")[0];
        setTask(spotTask, snapshot.task); //set the task



        var editButton = $(pageElement).find("#editSensorBtn")[0]; //set up the links as seen in child_changed listener
        $(editButton).data('name', snapshot.name);
        $(editButton).data('task', snapshot.task);
        $(editButton).data('address', snapshot.address);
        $(editButton).data('zone', snapshot.zone);
        $(editButton).data('status', snapshot.alive);
        $(editButton).data('battery', snapshot.battery);

        var historySensorBtn = $(pageElement).find("#historySensorBtn")[0]; //set up the links as seen in child_changed listener
        $(historySensorBtn).data('address', snapshot.address);
        $(historySensorBtn).data('task', snapshot.task);



        appendSensor(snapshot.zone,pageElement);

      }else{ //new sensor is a person sensor
        //console.log("Creating new person!");
      //  console.log(snapshot);

        var viewButton = $(pageElement).find("#viewPersonBtn")[0]; //set up the links as seen in child_changed listener
        $(viewButton).data('name', snapshot.name);
        $(viewButton).data('task', snapshot.task);
        $(viewButton).data('address', snapshot.address);
        $(viewButton).data('zone', snapshot.zone);
        $(viewButton).data('status', snapshot.alive);
        $(viewButton).data('battery', snapshot.battery);

        var profileRef = new Firebase("https://sunsspot.firebaseio.com/spotProfile/"+snapshot.address+"/FileName");

        profileRef.once("value", function(snapshot){
          var fileName = snapshot.val();
          //console.log(snapshot);
          if(fileName != "undefined.jpg"){
            var img = document.createElement("img");
            img.src = "../images/profile/" + fileName;
            img.width = 100;
            img.height = 100;
            $(pageElement).find("#profileImage").empty().append(img).removeClass("fa fa-user fa-4x");
          }

        });

        appendSensor(snapshot.zone,pageElement);

      }

      $(pageElement).removeClass('hidden'); //element created, so display it.
    }

    function setBattery(element, battery){
      $(element).removeAttr('style');
      $(element).removeClass();
      $(element).addClass('pull-left');
      if(battery < 6){
        $(element).addClass('fa fa-battery-0');
        $(element).css('color','red');
      }else if(battery < 21){
        $(element).addClass('fa fa-battery-0');
      }else if(battery < 41){
        $(element).addClass('fa fa-battery-1');
      }else if(battery < 61){
        $(element).addClass('fa fa-battery-2');
      }else if(battery < 81){
        $(element).addClass('fa fa-battery-3');
      }else{
        $(element).addClass('fa fa-battery-4');
      }
    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function setTask(element, task){
      taskLength = task.length; //get the length of the task string
     if(task == "s"){ //if the task is just "s" it must be idle
        element.innerHTML = "Idle Sensor";
      }else{
        if(task == "zone"){ //if the task is just "zone", then it's a static zone sensor
          element.innerHTML = "Zone sensor";
        }else{
          var elementString = ""; //initialise a string
          var appendCommas = false;
          for(var i = 0; i < taskLength; i++){ //loop through every letter

          var char = task.charAt(i); //get the current character
          if(char == "m"){ //if current char is m
            elementString = elementString + "Motion"; //append motion to the string
          }else if(char == "l"){
            elementString = elementString + "Light"; // .. etc..
          }else if(char == "t"){
            elementString = elementString + "Temperature";
          }else if(char == "b"){
            elementString = elementString + "Button";
          }else if(char == "s"){
            //ignore it as we handle it above (but still need to identify it here)
          }else{
            elementString = elementString + "Unknown: " + char; //if an unknown character is found, output the char as unknown
            console.log("Unkown char in task: " + task); //also log the task that contained the unkown char
          }
          if(i == taskLength-1){  //if we're at the last character in the string
            appendCommas = false; //dont append a comma
            elementString = elementString + " "; //but do append a speace
          }
          if(appendCommas){
            elementString = elementString + ", "; //if we're not at the start, append commas in between sensor types
          }
          appendCommas = true; //enable commas

        }
        element.innerHTML = elementString + "Sensor"; //once the string has been  built, append sensor and then insert it to the DOM
      }
      }
    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function updatePersonSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name;

      $(changedElement).find("#spotMAC")[0].innerHTML = snapshot.address;
      var batteryElement =  $(changedElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));
      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(!snapshot.alive ){
        $(status).css('background-color','darkred');

      }

      var link = $(changedElement).find("#viewPersonBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);
      $(link).data('status', snapshot.alive);
      $(link).data('battery', snapshot.battery);
      if(oldTask != snapshot.task){

        dataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings" + snapshot.address);
        dataRef.remove()
      }

      if (oldZone != snapshot.zone) { //if the zone has changed, the element needs to move to a different sub-heading
        appendSensor(snapshot.zone,changedElement);
      }

      var profileRef = new Firebase("https://sunsspot.firebaseio.com/spotProfile/"+snapshot.address+"/FileName");

      profileRef.once("value", function(snapshot){
        var fileName = snapshot.val();
        console.log(snapshot);
        if(fileName != "undefined.jpg"){
          var img = document.createElement("img");
          img.src = "../images/profile/" + fileName;
          img.width = 100;
          img.height = 100;
          $(changedElement).find("#profileImage").empty().append(img).removeClass("fa fa-user fa-4x");
        }

      });



    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function updateSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name; //populate element name
      var batteryElement =  $(changedElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));
      var spotTask = $(changedElement).find("#spotTask")[0];
      setTask(spotTask, snapshot.task); //set the task

      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(!snapshot.alive ){
        $(status).css('background-color','darkred');

      }

      var link = $(changedElement).find("#editSensorBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);
      $(link).data('status', snapshot.alive);
      $(link).data('battery', snapshot.battery);

      if(oldTask != snapshot.task){
        dataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address);
        dataRef.remove()
      }

      if (oldZone != snapshot.zone) { //if the task has changed, the element needs to move to a different sub-heading
        appendSensor(snapshot.zone,changedElement);
      }
    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function appendSensor(zone, element){
      if(zone == 1 || zone == 2 || zone == 3){
        $("#zone"+zone+"Sensors").append(element)
      }else{
        $("#zoneContainer").append(element)
      }

    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function createDataListeners(snapshot, element){
      console.log("LiveData Listener created");

      if(newSensor.task.indexOf("b") !== -1){
        var btnoutput = $(element).find("#liveDatabtn")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/button")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)
                    //btnoutput.innerHTML = "Button " + snapshot.val().newVal + " pressed at " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
          var buttonID = snapshot.val().newVal;

          if(buttonID == 1){
              btnoutput.innerHTML = "<span class='fa-stack fa-lg'><i class='fa fa-hand-pointer-o fa-stack-1x'></i><i class='fa fa-circle-o fa-stack-2x'></i></span>" + time.getHours() + ":" + time.getMinutes();
          }else if(buttonID == 2){
              btnoutput.innerHTML = "<i class='fa fa-sign-in fa-rotate-90 fa-2x'></i><b>" + buttonID + "</b> " + time.getHours() + ":" + time.getMinutes();
          }


        })
      }

      if(newSensor.task.indexOf("l") !== -1){
          var lightoutput = $(element).find("#liveDatalight")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/light")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)

          lightoutput.innerHTML = "<i class='fa fa-lightbulb-o fa-2x'></i> " + snapshot.val().newVal + " " + time.getHours() + ":" + time.getMinutes();
        })
      }

      if(newSensor.task.indexOf("m") !== -1){
          var motionoutput = $(element).find("#liveDatamotion")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/motion")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)

          motionoutput.innerHTML = "<i class='fa fa-arrows fa-2x'></i> "  + time.getHours() + ":" + time.getMinutes();
        })
      }




    }

    function createSensorTouchEvents(element){
      element = $(element).find(".card-content");
      //$(element).css("background-color","blue");
      var options = {};
      var hammerEvent = new Hammer(element[0], options);
      hammerEvent.get('press').set({ enable: true, threshold: 25 });
      hammerEvent.get('pinch').set({ enable: true, threshold: 0.3  });
      hammerEvent.get('rotate').set({ enable: true, threshold: 40 });


      hammerEvent.on('press', function(ev){
         //console.log("PRESS DETECTED");
         element.parent().find("#editSensorBtn")[0].click();
       })

       hammerEvent.on('pinchend', function(ev){
         //console.log("ROTATE END AND/OR PINCH END");

         //console.log(ev);
         if(ev.rotation >= 40 || ev.rotation <= -40){
          // console.log("Trigger rotation");
           element.parent().find("#locationHistoryBtn")[0].click();
         } else if(ev.scale > 1){
           //console.log("Trigger pinch out");
           element.parent().find("#historySensorBtn")[0].click();
         } else if(ev.scale < 1){
           //console.log("Trigger pinch in")
           element.parent().find(".card-header")[0].click();
         }
       })

    }

    function createPersonTouchEvents(element){
      element = $(element).find(".card-content");
      //$(element).css("background-color","blue");
      var options = {};
      var hammerEvent = new Hammer(element[0], options);
      hammerEvent.get('press').set({ enable: true, threshold: 25 });
      hammerEvent.get('pinch').set({ enable: true, threshold: 0.3  });
      hammerEvent.get('rotate').set({ enable: true, threshold: 40 });


      hammerEvent.on('press', function(ev){
         //console.log("PRESS DETECTED");
         element.parent().find("#viewPersonBtn")[0].click();
       })

       hammerEvent.on('pinchend', function(ev){
         //console.log("ROTATE END AND/OR PINCH END");

         //console.log(ev);
         if(ev.rotation >= 40 || ev.rotation <= -40){
          // console.log("Trigger rotation");
           element.parent().find("#locationHistoryBtn")[0].click();
         }else if(ev.scale < 1){
           //console.log("Trigger pinch in")
           element.parent().find(".card-header")[0].click();
         }
       })

    }

    var settingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    settingsRef.on("child_added", function(snapshot) { //listen for when a child is added : also triggers once for each child in database on page load.
          //console.log(snapshot.key());

        newSensor = snapshot.val();
        console.log(newSensor.task.indexOf("p"));
        if(newSensor.task.indexOf("p") === -1){ //sensor is not a person tracker as p is not in the task string.

          newSensor.address = snapshot.key();

          var sensorElement = $("#sensorTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces

          createSensor(newSensor, sensorElement);

          createDataListeners(newSensor, sensorElement);

          createSensorTouchEvents(sensorElement);

          $(sensorElement).draggable({containment: "parent"});

        }else{ //sensor is a person tracker

          newSensor.address = snapshot.key();

          var personElement = $("#personTemplate").clone();
          $(personElement).attr('id', newSensor.address.replace(/ /g, "_"));

            createSensor(newSensor, personElement);

            createPersonTouchEvents(personElement);

            $(personElement).draggable({containment: "parent"});
        }


    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    settingsRef.on("child_changed", function(snapshot) { //listen for when a child is edited
        console.log('child changed');

        var changedSensor = snapshot.val();
        changedSensor.address = snapshot.key();


        var changedElement = $('#' + snapshot.key().replace(/ /g, "_"))[0] //element ID's are the MAC address with underscores instead of spaces

        var link = $(changedElement).find(".data-button")[0]; //find the link to Edit modal
        var oldTask = $(link).data('task');

        var newTask = changedSensor.task;

        console.log("newTask : " + newTask + " | oldTask : " + oldTask);

        if(oldTask == "sp" && newTask == "sp"){
            //person stayed a person
          updatePersonSensor(changedSensor, changedElement);


        }
        else if(oldTask == "sp" && newTask != "sp"){
          console.log("Triggered");
          //person became sensor
          $(changedElement).remove(); //remove the old sensor, as it's type has changed.

          changedSensor.address = snapshot.key();

          var sensorElement = $("#sensorTemplate").clone(); //create an instance of the new template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces

          createSensor(changedSensor, sensorElement);


        }
        else if(oldTask != "sp" && newTask == "sp"){
          //sensor became person
                    $(changedElement).remove();
                    var personElement = $("#personTemplate").clone();
                    $(personElement).attr('id', changedSensor.address.replace(/ /g, "_"));

                    createSensor(changedSensor, personElement);

        }
        else if(oldTask != "sp" && newTask != "sp"){
          //sensor stayed sensor
          updateSensor(changedSensor, changedElement);

        }

    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $(document).on("click", "#editSensorBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        //console.log(task);
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');

        var modal = $("#myModal"); //get the modal element

        if(task == "sp"){
          //person sensor
          modal.find("#editSensorTypeSelect").val("sp").change();
        }else if(task == "zone"){
          //zone sensor
          modal.find("#editSensorTypeSelect").val("zone").change();
        }else if(task == "s"){
          //idle sensor
          modal.find("#editSensorTypeSelect").val("s").change();
        }else{
          //multi sensor
          modal.find("#editSensorTypeSelect").val("multi").change();
          if(task.indexOf("m") !== -1){
              $("input#m").prop("checked", true);
          }
          if(task.indexOf("l") !== -1){
              $("input#l").prop("checked", true);
          }
          if(task.indexOf("t") !== -1){
              $("input#t").prop("checked", true);
          }
          if(task.indexOf("b") !== -1){
              $("input#b").prop("checked", true);
          }

        }


        modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("input#" + task).prop("checked", true);
        modal.find("#sensorZone")[0].innerHTML = zone;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

      //  console.log(name);
    });

    /**
   * When #historySensorBtn is clicked, it opens a dialog and sets spotId to its <div>
   * to allow setSensorHistoryChart to plot graph on the div
   * @author Anson Cheung
   */
    $(document).on("click", "#historySensorBtn", function() {

        var address = $(this).data('address');
        var spotId = address.slice(-4);
        var sensorType = $(this).data('task');

        ngDialog.open({
            template: '<div id="' + spotId + '_0" class="history-chart"></div>' +
                      '<div id="' + spotId + '_1" class="history-chart"></div>' +
                      '<div id="' + spotId + '_2" class="history-chart"></div>' +
                      '<div id="' + spotId + '_3" class="history-chart"></div>' +
                      '<div id="' + spotId + '_4" class="history-chart"></div>' +
                      '<div id="' + spotId + '_5" class="history-chart"></div>',
            plain: true
        });

        //console.log(sensorType);
        $scope.setSensorHistoryChart(address, spotId, sensorType);

    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $(document).on("click", "#viewPersonBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');
        //console.log(battery);
        var modal = $("#viewPerson");
        if(task == "sp"){
          //person sensor
          modal.find("#viewSensorTypeSelect").val("sp").change();
        }else if(task == "zone"){
          //zone sensor
          modal.find("#viewSensorTypeSelect").val("zone").change();
        }else if(task == "s"){
          //idle sensor
          modal.find("#viewSensorTypeSelect").val("s").change();
        }else{
          //multi sensor
          modal.find("#viewSensorTypeSelect").val("multi").change();
          if(task.indexOf("m") !== -1){
              $("input#vm").prop("checked", true);
          }
          if(task.indexOf("l") !== -1){
              $("input#vl").prop("checked", true);
          }
          if(task.indexOf("t") !== -1){
              $("input#vt").prop("checked", true);
          }
          if(task.indexOf("b") !== -1){
              $("input#vb").prop("checked", true);
          }

        }

        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        modal.find("#personZone")[0].innerHTML = zone

        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

        profileSrc = $(this).parents("div.card").find("img").attr('src');
        profileSrc = profileSrc.split("/");
        //console.log(profileSrc[profileSrc.length -1]);

        profileSrc = profileSrc[profileSrc.length -1].split(".")
        //console.log(profileSrc[0]);
        profileSrc = profileSrc[0];

        $("input[name=profilePic][value="+ profileSrc +"]").prop('checked', true);

    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $(document).on("click", "#locationHistoryBtn", function(){

        var address = $(this).data('address');

        var modal = $("#historyPlayback");

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("#table_div")[0].innerHTML = "";

    })

    $(document).on("click", ".card-header", function(){
      console.log("trigger minimise");
      $(this).parent(".card").find(".card-content").toggle();
      $(this).parent(".card").find(".card-footer").toggle();
    })
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $("#editSensorTypeSelect").change(function(){

      if($(this).val() == "multi"){
        $("#editSensorCheckbox").removeClass("hidden");
      }else{
        $("#editSensorCheckbox").addClass("hidden");
      }
    })
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $("#viewSensorTypeSelect").change(function(){
      //console.log("Select changed!");
      //console.log($(this).val());
      if($(this).val() == "multi"){
        $("#viewSensorCheckbox").removeClass("hidden");
      }else{
        $("#viewSensorCheckbox").addClass("hidden");
      }
    })
  }

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.deleteSubmit = function() {
    console.log("in func");
      var address = document.getElementById('deleteSpotAddress').innerHTML; //read in the address
      console.log("Deleting " + address); //log the delete address just in case

      var delRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + address); //programatically generate the reference url
      var delMapRef = new Firebase("https://sunsspot.firebaseio.com/map/" + address);
      delRef.remove(); //call the remove function to remove the data from Firebase
      delMapRef.remove() //delete the spot from the map, as well.
      $("#" + address.replace(/ /g, "_")).remove(); //remove th element from the DOM
      $('.modal').modal('hide');
  };

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.modalSubmit = function() {

      var modal = $("#myModal")
      var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values
      var newName = modal.find("#name")[0].value;
      var newZone = parseInt($("span#sensorZone")[0].innerHTML);
      var newTask = modal.find('#editSensorTypeSelect').val();
      var status = modal.find("#sensorStatus")[0].innerHTML;
      var newBattery = modal.find("#battery")[0].innerHTML;
      if(newTask == "multi"){
        var multiTask = "s";
        if($("input#m").is(':checked')){

          multiTask += "m";
        }
        if($("input#l").is(':checked')){

          multiTask += "l";
        }
        if($("input#t").is(':checked')){

          multiTask += "t";
        }
        if($("input#b").is(':checked')){

          multiTask += "b";
        }
        newTask = multiTask;
      }

      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data
      $("input#m").prop("checked", false);
      $("input#l").prop("checked", false);
      $("input#t").prop("checked", false);
      $("input#b").prop("checked", false);
  };

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.personSubmit = function() {

    var modal = $("#viewPerson")
    var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values
    var newName = modal.find("#name")[0].value;
    var newZone = parseInt($("span#personZone")[0].innerHTML);
    var status = modal.find("#sensorStatus")[0].innerHTML;
    var newBattery = modal.find("#battery")[0].innerHTML;
    var newTask = modal.find('#viewSensorTypeSelect').val();
    if(newTask == "multi"){
      var multiTask = "s";
      if($("input#vm").is(':checked')){

        multiTask += "m";
      }
      if($("input#vl").is(':checked')){

        multiTask += "l";
      }
      if($("input#vt").is(':checked')){

        multiTask += "t";
      }
      if($("input#vb").is(':checked')){

        multiTask += "b";
      }
      newTask = multiTask;
    }

      var chosenProfilePic = $('input[name=profilePic]:checked').val();
      console.log("Profile pic : " + chosenProfilePic);
      var profRef =  new Firebase("sunsspot.firebaseio.com/spotProfile/"+address+"/FileName")
      profRef.set(chosenProfilePic + ".jpg");


      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data


          $("input#vm").prop("checked", false);
          $("input#vl").prop("checked", false);
          $("input#vt").prop("checked", false);
          $("input#vb").prop("checked", false);

  };


    /**
   * Pop up light & temp history graphs for the 3 zones.
   * Developer note: It uses ngDialog directive
   * @param {String} zoneHistory - For example zone 1 light would be 'zone1light', zone 2 temp 'zone2temp' etc.
   * @author Anson Cheung
   */
    $scope.openHistory = function(zoneHistory){
        ngDialog.open({
            template: '<div google-chart chart="' + zoneHistory + '" class="history-chart"></div>',
            plain: true
        });
    };

    /**
     * Generate a annotation graph and set it to a <div>
     * @param {String} address - Full address of a sensor.
     * @param {String} spotId - The last 4 letters of the spot's ID. Example: '76D3', '797D'.
     * @author Anson Cheung
     */
    $scope.setSensorHistoryChart = function(address, spotId, sensorType){
        var sensorTypeName = [];

        for(i in sensorType){
          switch(sensorType[i]){

            case 'm':
              sensorTypeName[i] = "motion";
              break;

            case 'l':
              sensorTypeName[i] = "light";
              break;

            case 't':
              sensorTypeName[i] = "temperature";
              break;

            case 'b':
              sensorTypeName[i] = "button";
              break;

            default:
              sensorTypeName[i] = sensorType[i];
          }
        }

        for(i in sensorTypeName){

          //Only showing motion, light, temperature, button graphs
          if(sensorTypeName[i].length > 1){

            var address = trim(address); //Replace spaces with %20%

            var spotRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address + "/" + sensorTypeName[i]);

            $scope.populateChart(spotRef, spotId, i, sensorTypeName[i]);
          }
        }

    }

    /**
     * Populate data into chart
     * (Google visualization has been called in index.html so google.load("visualization") is redundant here
     * @param {Object} spotRef - Full address of a sensor.
     * @param {String} spotId - The last 4 letters of the spot's ID. Example: '76D3', '797D'.
     * @param {int} i - Index of sensorTypeName[]
     * @param {String} sensorTypeName - Name of the sensor.
     * @author Anson Cheung
     */
    $scope.populateChart = function(spotRef, spotId, i, sensorTypeName){

      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Date');
      data.addColumn('number', sensorTypeName);

      spotRef.once("value", function(snapshot) {
        var newLog = snapshot.val();

        for (var log in newLog)
            data.addRow([new Date(newLog[log].timestamp),newLog[log].newVal]);

        drawChart(data, spotId + '_' + i, ['#004D40', '#00695C', '#00796B']);
      });

    }

    /**
     * Draw Chart to <div> with the given data
     * @param {data} data - Google chart object
     * @param {String} bindDivName - <div> name you want to bind your graph to
     * @param {colors}
     * @author Anson Cheung
     */
    function drawChart(data, bindDivName, colors) {

          var chart = new google.visualization.AnnotationChart(document.getElementById(bindDivName));

          var options = {
            displayAnnotations: true,
            zoomButtons:{
                  '1m': { 'label': '1m', 'offset': [0, 1, 0] },
                  '15m': { 'label': '15m', 'offset': [0, 15, 0] },
                  '1h': { 'label': '1h', 'offset': [1, 0, 0] },
                  '6hs': { 'label': '6h', 'offset': [6, 0, 0] },
                  '1d': { 'label': '1d', 'offset': [1, 0, 0, 0, 0]},
                  '5d': { 'label': '5d', 'offset': [5, 0, 0, 0, 0] },
                  '1w': { 'label': '1w', 'offset': [7, 0, 0, 0, 0] },
            },
            zoomButtonsOrder: ['1m', '15m', '1h', '6h', '1d', '5d', '1w', 'max'],
          };

          options.colors = colors;

          chart.draw(data, options);
        }

    $scope.init();
}]);



spotApp.controller('mapTestController', ['$scope','$firebaseObject', '$firebaseArray',
function($scope, $firebaseObject, $firebaseArray) {

        //Set map map reference
        var mapRef = new Firebase("https://jalp330.firebaseio.com/Map/");

        //An array of a list of index references
        $scope.list = [];

        //Set each index of the list array as a reference of each index
        for(var i = 0; i < (33*11); i++)
          $scope.list[i] = $firebaseArray(new Firebase("https://jalp330.firebaseio.com/Map/index_" + i));


        /**
         * Creating a range between two defined numbers, eg. 5 to 15
         * @param {min} min - Min number of the starting range.
         * @param {max} max - Max number of the starting range..
         * @param {step}(Optional) step - Steps in between each loop, in default, it sets to 1.
         * @return {array} - An array of a range of two defined numbers.
         * @author Anson Cheung
         */
        $scope.rangeIn = function(min, max, step){
            step = step || 1;
            var array = [];

            for (var i = min; i <= max; i += step)
              array.push(i);

            return array;
        };


        $scope.zone1 = []; //Range of zone 1
        $scope.zone2 = []; //Range of zone 2
        $scope.zone3 = []; //Range of zone 3

        //Set zone 1 range

        $scope.zone1 = $scope.zone1.concat($scope.rangeIn(0, 0+10))
                                   .concat($scope.rangeIn(33, 33+10))
                                   .concat($scope.rangeIn(66, 66+10))
                                   .concat($scope.rangeIn(99, 99+10))
                                   .concat($scope.rangeIn(132, 132+10))
                                   .concat($scope.rangeIn(165, 165+10))
                                   .concat($scope.rangeIn(198, 198+10))
                                   .concat($scope.rangeIn(231, 231+10))
                                   .concat($scope.rangeIn(264, 264+10))
                                   .concat($scope.rangeIn(297, 297+10))
                                   .concat($scope.rangeIn(330, 330+10));
        //Set zone 2 range
        $scope.zone2 = $scope.zone2.concat($scope.rangeIn(11, 11+10))
                                   .concat($scope.rangeIn(44, 44+10))
                                   .concat($scope.rangeIn(77, 77+10))
                                   .concat($scope.rangeIn(110, 110+10))
                                   .concat($scope.rangeIn(143, 143+10))
                                   .concat($scope.rangeIn(176, 176+10))
                                   .concat($scope.rangeIn(209, 209+10))
                                   .concat($scope.rangeIn(242, 242+10))
                                   .concat($scope.rangeIn(275, 275+10))
                                   .concat($scope.rangeIn(308, 308+10))
                                   .concat($scope.rangeIn(341, 341+10));
        //Set zone 3 range
        $scope.zone3 = $scope.zone3.concat($scope.rangeIn(22, 22+10))
                                   .concat($scope.rangeIn(55, 55+10))
                                   .concat($scope.rangeIn(88, 88+10))
                                   .concat($scope.rangeIn(121, 121+10))
                                   .concat($scope.rangeIn(154, 154+10))
                                   .concat($scope.rangeIn(187, 187+10))
                                   .concat($scope.rangeIn(220, 220+10))
                                   .concat($scope.rangeIn(253, 253+10))
                                   .concat($scope.rangeIn(286, 286+10))
                                   .concat($scope.rangeIn(319, 319+10))
                                   .concat($scope.rangeIn(352, 352+10));

        /**
         * Update object's location when it's dropped to a new location
         * @param {Object} data - an object that contains a sensor's data.
         * @param {evt} event - Indicate the type of mouse event.
         * @param {int} indexNumber - The current index of an array.
         * @author Anson Cheung
         */
        $scope.onDropComplete=function(data, evt, indexNumber){

            var index = $scope.list[indexNumber].indexOf(data);

            //Check for existence of data inside an array (If array contains data)
            if (index == -1){

              //Get the snapshot from the firebase map reference
              mapRef.once("value", function(snapshot) {

                //From the snapshot, get each childsnapshot index (index_0, index_1, .. , index_999)
                snapshot.forEach(function(childSnapshot){

                  //Set child reference as, etc, https://xxx.firebaseio.com/Map/index_0
                  var childRef = mapRef.child(childSnapshot.key());

                  //Remove OLD index/location of the object
                  $scope.remove(childRef, data.$id, indexNumber);

                });

                //Set data reference as, etc, https://xxx.firebaseio.com/Map/index_0/(object_name)
                var dataRef = mapRef.child("index_" + indexNumber).child(data.$id);

                //Update new index/locatino for the object
                $scope.update(dataRef, data.name, data.task, data.zone);
                console.log("NEW INDEX: " + indexNumber);
              });

            }

        }

        /**
         * Remove OLD index/location of an object
         * @param {FirebaseReference} childRef - an index reference of the map.
         * @param {String} id - The data name of the JSON object.
         * @param {int} indexNumber - The current index of an array.
         * @author Anson Cheung
         */
        $scope.remove = function(childRef, id, indexNumber){

          //Get the snapshot from the firebase map->index reference
          childRef.once("value", function(snapshot){

            //Set var to true/false if 'index_X' exists
            var indexFoundSpotID = snapshot.child(id).exists();

            //if it exists
            if(indexFoundSpotID){

              //Find its index name
              var indexName = snapshot.key();

              console.log("OLD INDEX: " + indexName);

              //Use the found index name
              var dataRef = mapRef.child(indexName).child(id);

              //and removes its data
              dataRef.remove();
            }

          })
        }

        /**
         * Update NEW index/location of an object
         * @param {FirebaseReference} ref - an index reference of the map.
         * @param {String} name - The name of a sensor.
         * @param {String} task - The task of a sensor.
         * @param {String} zone - The zone of a sensor.
         * @author Anson Cheung
         */
        $scope.update = function(ref, name, task, zone){
          ref.set({
              name: name,
              task: task,
              zone: zone
          });
        }

        /**
         * Return an array of a desired range of numbers.
         * @param {int} num - The length of an array.
         * @return {Array(num)} - Return an array of numbers.
         * @author Anson Cheung
         */
        $scope.range = function(num) {
            return new Array(num);
        }




}]);

//Map Controller
spotApp.controller('mapController', ['$scope','$firebaseObject', '$log',
function($scope, $firebaseObject, $log) {

    $scope.$log = $log;

    /*-------------------------------*/
    // $scope.draggableObjects = [{name:'one'}, {name:'two'}, {name:'three'}];

    // var onDraggableEvent = function (evt, data) {
    //     console.log("128", "onDraggableEvent", evt, data);
    // }

    // $scope.$on('draggable:start', onDraggableEvent);
   // $scope.$on('draggable:move', onDraggableEvent);
    // $scope.$on('draggable:end', onDraggableEvent);

    $scope.number = 33 * 11;

    $scope.range = function(num) {
        return new Array(num);
    }

    $scope.onDropComplete = function (data, evt) {
        var index = $scope.sensors.indexOf(data);
        if (index == -1)
            $scope.sensors.push(data);
    }

    $scope.onDragSuccess = function (data, evt) {
        var index = $scope.sensors.indexOf(data);
        if (index > -1)
            $scope.sensors.splice(index, 1);
    }

    $scope.applyListener = function(i){

        $scope.droppedObjectsArray.push([]);

        $scope.onDropCompleteArray[i] = function (data, evt) {
            var index = $scope.droppedObjectsArray[i].indexOf(data);
            if (index == -1){
                $scope.droppedObjectsArray[i].push(data);

                //UPDATE SENSOR MAININDEX IN FIREBASE
                // $scope.ref[0].update({"mainIndex" : i});
                // console.log(mainIndex);
                $scope.updateIndex(data, i);
            }

        }

        $scope.onDragSuccessArray[i] = function (data, evt) {
            var index = $scope.droppedObjectsArray[i].indexOf(data);
            if (index > -1){
                $scope.droppedObjectsArray[i].splice(index, 1);
            }
        }
    }

    $scope.updateIndex = function(data, i){
      var key = trim(data.$id);
      var ref = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + key);

      ref.update({"mainIndex" : i});
    }


    $scope.addTo = function(sensorObj, mainIndex){
      $scope.droppedObjectsArray[mainIndex] = sensorObj;
    }

    $scope.droppedObjectsArray = [];
    $scope.onDropCompleteArray = [];
    $scope.onDragSuccessArray = [];

    for(i=0;i<$scope.number;i++)
      $scope.applyListener(i);

    /*--------------------------------------------*/

    $scope.ref = [];
    $scope.syncObject = [];
    $scope.sensors = [];

    var j = 0;

    // Retrieve new sensors as they are added to our database
    spotSettingsRef.on("child_added", function(snapshot) {
        var key = trim(snapshot.key());

        $scope.ref[j] = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + key);

        var localObject = $scope.syncObject[j];

        // download the data into a local object
        localObject = $firebaseObject($scope.ref[j]);

        // synchronize the object with a three-way data binding
        localObject.$bindTo($scope, "sensor_" + j);

        $scope.sensors[j] = localObject;

        if(snapshot.val().mainIndex != null){
          $scope.droppedObjectsArray[snapshot.val().mainIndex].push($scope.sensors[j]);
        }

        j++;
    });

    //Generate Grid Table
    $scope.data = [];
    $scope.x = 7.69; // height of a sqaure in %
    $scope.y = 3.025; // Width of a square in %

    $scope.zone1 = "zone1";
    $scope.zone2 = "zone2";
    $scope.zone3 = "zone3";

    for(i=0;i<13;i++)
        for(y=0;y<33;y++)
            $scope.data.push({x: i, y: y});

}]);

//Map - Box directive
spotApp.directive('box', function(){

    return {
        restrict: 'E',
        scope: {
            data: '=',
            x: '=',
            y: '=',
            zone: '=',
        },
        template: '<div class="box {{zone}} box-{{x}}-{{y}}" style="top:{{x}}%;left:{{y}}%"></div>',
        controller: function($scope){
            // console.log($scope.data);
        }
    };
});

// Map - Sensor directive
spotApp.directive('sensor', function(){
    return{
        restrict:'E',
        scope:{
            zone : '=',
            task : '=',
            name : '=',
            x: '=',
            y: '='
        },
        template: '<div class="sensor" style="top:{{x}}%;left:{{y}}%"><img style="width:100%;" src="images/{{task}}.png" ><p>{{name}}</p></div>'
    };
});

function trim(string){
  return string.replace(/\s+/g, '%20');
}

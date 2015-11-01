/*************************************************************************
 * SCC330 Network Studio - Team 2 - JALP SmartLab
 *
 *************************************************************************
 * 
 * @author
 * Anson Cheung
 *
 *************************************************************************/

//modules
var spotApp = angular.module('spotApp', ['ngRoute', 'ngResource', 'firebase', 'googlechart']);
var ref = new Firebase("https://sunsspot.firebaseio.com");

//Routes
spotApp.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/livedata', {
            templateUrl: 'pages/livedata.html',
            controller: 'liveController'
        })
        .when('/history', {
            templateUrl: 'pages/history.html',
            controller: 'historyController'
        })
        .when('/sensors', {
            templateUrl: 'pages/sensors.html',
            controller: 'sensorsController'
        })
        .otherwise({
            redirectTo: '/livedata'
        });

    $locationProvider.html5Mode(true).hashPrefix('!');
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



    /*----- LIVE DATA PAGE -----*/
    var liveZoneLight = [];
    var liveZoneTemp = [];

    for (i = 0; i < 3; i++) {

        //Light
        liveZoneLight[i] = {};
        setChart('Gauge', liveZoneLight[i], 'light');
        listenLive('zone' + (i + 1), liveZoneLight[i], 'light');

        //Temperature
        liveZoneTemp[i] = {};
        setChart('Gauge', liveZoneTemp[i], 'temp');
        listenLive('zone' + (i + 1), liveZoneTemp[i], 'temp');

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


    //----------TESTING----------//
    var liveLightTest = {};
    liveLightTest.type = "AnnotationChart";

    liveLightTest.data = {
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

    ref.child('zone1').limitToLast(7).on('child_added', function(snapshot) {
        var data = snapshot.val();
        var timestamp = new Date(data.timestamp);

        liveLightTest.data.rows.push({
            c: [{
                v: new Date(timestamp)
            }, {
                v: data.light
            }, ]
        });


    });

    liveLightTest.options = {
        displayAnnotations: false,
        zoomButtonsOrder: ['1-hour', 'max'],
        colors: ['#00FF00', '#00FF00', '#00FF00']
    };

    $rootScope.liveLightTest = liveLightTest;

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

        pushData('zone' + (i + 1) + 'hourly', zoneLight[i], 'light');

        zoneLight[i].options = {
            displayAnnotations: false,
            zoomButtonsOrder: ['1-hour', 'max'],
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
                label: "Temp (°C)",
                type: "number"
            }],
            "rows": []
        };

        pushData('zone' + (i + 1) + 'hourly', zoneTemp[i], 'temp');

        zoneTemp[i].options = {
            displayAnnotations: false,
            zoomButtonsOrder: ['1-hour', 'max'],
            colors: ['#FF0000', '#FF0000', '#FF0000']
        };
    }

    $rootScope.zone1light = zoneLight[0];
    $rootScope.zone2light = zoneLight[1];
    $rootScope.zone3light = zoneLight[2];

    $rootScope.zone1temp = zoneTemp[0];
    $rootScope.zone2temp = zoneTemp[1];
    $rootScope.zone3temp = zoneTemp[2];

})
//Live Data Controller
spotApp.controller('liveController', ['$scope','$firebaseArray',
function($scope, $firebaseArray){

    $scope.initSlider = function(){
        $("p").click(function(){
            $(this).hide();
        });
    }

    $scope.initSlider();

}]);



//History Controller
spotApp.controller('historyController', ['$scope','$firebaseObject',
function($scope, $firebaseObject) {

}]);



//Sensors Controller
spotApp.controller('sensorsController', ['$scope',
    function($scope) {
        var ref = new Firebase("https://sunsspot.firebaseio.com/testObjects");
        var sensors = null;
        var changedRef = new Firebase("https://sunsspot.firebaseio.com/testObjects");

        $scope.initSlider = function() {

            $(document).on("click", "#modalLink", function() { //when you open the Edit modal
                var name = $(this).data('name'); //populate variables from data-attributes
                var task = $(this).data('task');
                var address = $(this).data('address');

                var modal = $(".modal"); //get the modal element
                modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element
                modal.find("#spotAddress")[0].innerHTML = address;
                modal.find("input#name")[0].value = name;
                modal.find("input#" + task).prop("checked", true);

            });

            $(document).on("click", "#deleteLink", function() {

                var name = $(this).data('name');
                var task = $(this).data('task');
                var address = $(this).data('address');


                var modal = $("#deleteModal");
                modal.find("#myModalLabel")[0].innerHTML = name;
                modal.find("#deleteSpotAddress")[0].innerHTML = address;


            });

            // function deleteSubmit(){
            $scope.deleteSubmit = function() {
                var address = document.getElementById('deleteSpotAddress').innerHTML; //read in the address
                console.log("Deleting " + address); //log the delete address just in case

                var delRef = new Firebase("https://sunsspot.firebaseio.com/testObjects/" + address); //programatically generate the reference url

                delRef.remove(); //call the remove function to remove the data from Firebase
                $("#" + address).remove(); //remove th element from the DOM
            };

            $scope.modalSubmit = function() {
                var address = document.getElementById('spotAddress').innerHTML; //populate variables based off of form values
                var newName = document.getElementById('name').value;
                var newTask = $('input[name="optradio"]:checked').val();

                var updateRef = new Firebase("https://sunsspot.firebaseio.com/testObjects/"); //create reference

                updateRef.child(address).set({
                    name: newName,
                    task: newTask
                }); //update the record with the new data
            };

            var changedRef = new Firebase("https://sunsspot.firebaseio.com/testObjects");

            changedRef.on("child_changed", function(snapshot) { //listen for when a child is edited

                var changedSensor = snapshot.val();

                var changedElement = $('#' + snapshot.key().replace(/ /g, "_"))[0] //element ID's are the MAC address with underscores instead of spaces

                $(changedElement).find("#spot-name")[0].innerHTML = changedSensor.name; //populate element name

                var link = $(changedElement).find("#modalLink")[0]; //find the link to Edit modal

                var oldTask = $(link).data('task'); //get the old task from the data attribute on the link

                $(link).data('name', changedSensor.name); //update the data attributes to the new data
                $(link).data('task', changedSensor.task);

                var deleteLink = $(changedElement).find("#deleteLink")[0]; //get the link to Remove
                $(deleteLink).data('name', changedSensor.name); //update data attributes on Remove link
                $(deleteLink).data('task', changedSensor.task);

                if (oldTask != changedSensor.task) { //if the task has changed, the element needs to move to a different sub-heading
                    $(changedElement).find('#dataOutput').remove() //if task has changed, then the Readings must have been deleted : remove the graph from the DOM

                    if (changedSensor.task == "idle") { //sensor is idle

                        $("#idle-sensor-list").append(changedElement); //append element to the correct section

                    } else if (changedSensor.task == "sm") { //sensor is motion sensor

                        $("#motion-sensor-list").append(changedElement);

                    } else if (changedSensor.task == "sl") { //sensor is light sensor
                        console.log("light");

                        $("#light-sensor-list").append(changedElement);

                    } else if (changedSensor.task == "st") { //sensor is temp sensor
                        console.log("temp");

                        $("#temp-sensor-list").append(changedElement);

                    } else { //sensor is zone sensor, or unknown
                        console.log("SENSOR NOT: idle, temp, light or motion");

                        $("#unknownTasks").append(changedElement);

                    }
                }

            });

            ref.on("child_added", function(snapshot) { //listen for when a child is added : also triggers once for each child in database on page load.
                //  console.log(snapshot.key());

                newSensor = snapshot.val();


                var sensorElement = $("#sensorTemplate").clone(); //create an instance of the template

                $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces


                $(sensorElement).find("#spot-name")[0].innerHTML = newSensor.name; //insert the spot name

                if (newSensor.Readings) { //if the sensor has data to display

                    var readings = newSensor.Readings //extract the readings

                    var dt = new google.visualization.DataTable //construct a DataTable
                    dt.addColumn({
                        type: 'string',
                        id: 'Role'
                    });
                    dt.addColumn({
                        type: 'datetime',
                        id: 'Start'
                    });
                    dt.addColumn({
                        type: 'datetime',
                        id: 'End'
                    });

                    for (x in readings) {
                        //  console.log(readings[x]);

                        dt.addRow(
                            [newSensor.name, new Date(readings[x]), new Date(readings[x] + 100)] //add a row for each reading
                        );

                    }

                    var options = {
                            width: 800,
                            chartArea: {
                                left: 100
                            }

                        }
                        //  $(sensorElement).find("#dataOutput").css();
                    var chart = new google.visualization.Timeline($(sensorElement).find("#dataOutput")[0]); //assign the chart container to be the dataOutput div within this element
                    chart.draw(dt, options); //draw the chart


                }

                var link = $(sensorElement).find("#modalLink")[0]; //set up the links as seen in child_changed listener
                $(link).data('name', newSensor.name);
                $(link).data('task', newSensor.task);
                $(link).data('address', snapshot.key());

                var deleteLink = $(sensorElement).find("#deleteLink")[0];
                $(deleteLink).data('name', newSensor.name);
                $(deleteLink).data('task', newSensor.task);
                $(deleteLink).data('address', snapshot.key());

                if (newSensor.task == "idle") { //sensor is idle

                    $("#idle-sensor-list").append(sensorElement);


                    sensorElement.removeClass('hidden');

                } else if (newSensor.task == "sm") { //sensor is motion sensor

                    $("#motion-sensor-list").append(sensorElement);
                    sensorElement.removeClass('hidden');
                } else if (newSensor.task == "sl") { //sensor is light sensor
                    //  console.log("light");

                    $("#light-sensor-list").append(sensorElement);
                    sensorElement.removeClass('hidden');
                } else if (newSensor.task == "st") { //sensor is temp sensor
                    //  console.log("temp");

                    $("#temp-sensor-list").append(sensorElement);
                    sensorElement.removeClass('hidden');
                } else { //sensor is zone sensor
                    console.log("SENSOR NOT: idle, temp, light or motion");

                    $("#unknownTasks").append(sensorElement);
                    sensorElement.removeClass('hidden');
                }
            });

        }

        $scope.initSlider();
    }
]);


/**
 * Adds two numbers
 * @param {Number} a 
 * @param {Number} b
 * @return {Number} sum
 */
function setChart(chartType, object, type) {

    object.type = chartType;

    if (type === 'light') {
        object.options = {
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
        object.options = {
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
 * Adds two numbers
 * @param {Number} a 
 * @param {Number} b
 * @return {Number} sum
 */
function listenLive(childName, object, type) {
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
                ['Temp (°C)', temp]
            ];
        }
    });
}
/**
 * Adds two numbers
 * @param {Number} a 
 * @param {Number} b
 * @return {Number} sum
 */
function pushData(childName, object, type) {
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
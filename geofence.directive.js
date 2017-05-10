angular.module('geoFence', [])
    .directive('ngGeofence', function() {
        return {
            restrict: 'E',
            scope: {
                zones: "=zones",
                getPartner: "&",
                getUsers: "&",
                phlebos: "=",
                saveZone: "&"
            },
            templateUrl: "partials/directives/geofencing/geofence.html",
            controller: ['$scope', '$timeout', function($scope, $timeout, $watch) {

                // googlemap variables //
                $scope.temp = {};
                var markers = [];
                var defaultShape;
                var drawingManager;
                $scope.temp.selectAllPhlebo = false;
                $scope.temp.users = [];
                $scope.temp.zoneUsers = []; //for existing partners
                $scope.temp.existingPartners = [];
                var overlays = [];
                var userOverlays = []; //to draw and hide the shape
                $scope.lat = 19.119126;
                $scope.lng = 72.890775;
                $scope.getAllUsers = false;

                const lineSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3
                }

                if (!$scope.zones)
                    $scope.zones = {};



                $scope.showMap = function() {
                    // if(!map){
                    map = new google.maps.Map(document.getElementById('map'), {
                        center: { lat: $scope.lat, lng: $scope.lng },
                        zoom: 17,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        streetViewControl: false,
                        styles: [
                            { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
                            { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
                            { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] }, {
                                featureType: 'administrative',
                                elementType: 'geometry.stroke',
                                stylers: [{ color: '#c9b2a6' }]
                            }, {
                                featureType: 'administrative.land_parcel',
                                elementType: 'geometry.stroke',
                                stylers: [{ color: '#dcd2be' }]
                            }, {
                                featureType: 'administrative.land_parcel',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#ae9e90' }]
                            }, {
                                featureType: 'landscape.natural',
                                elementType: 'geometry',
                                stylers: [{ color: '#dfd2ae' }]
                            }, {
                                featureType: 'poi',
                                elementType: 'geometry',
                                stylers: [{ color: '#dfd2ae' }]
                            }, {
                                featureType: 'poi',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#93817c' }]
                            }, {
                                featureType: 'poi.park',
                                elementType: 'geometry.fill',
                                stylers: [{ color: '#a5b076' }]
                            }, {
                                featureType: 'poi.park',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#447530' }]
                            }, {
                                featureType: 'road',
                                elementType: 'geometry',
                                stylers: [{ color: '#f5f1e6' }]
                            }, {
                                featureType: 'road.arterial',
                                elementType: 'geometry',
                                stylers: [{ color: '#fdfcf8' }]
                            }, {
                                featureType: 'road.highway',
                                elementType: 'geometry',
                                stylers: [{ color: '#f8c967' }]
                            }, {
                                featureType: 'road.highway',
                                elementType: 'geometry.stroke',
                                stylers: [{ color: '#e9bc62' }]
                            }, {
                                featureType: 'road.highway.controlled_access',
                                elementType: 'geometry',
                                stylers: [{ color: '#e98d58' }]
                            }, {
                                featureType: 'road.highway.controlled_access',
                                elementType: 'geometry.stroke',
                                stylers: [{ color: '#db8555' }]
                            }, {
                                featureType: 'road.local',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#806b63' }]
                            }, {
                                featureType: 'transit.line',
                                elementType: 'geometry',
                                stylers: [{ color: '#dfd2ae' }]
                            }, {
                                featureType: 'transit.line',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#8f7d77' }]
                            }, {
                                featureType: 'transit.line',
                                elementType: 'labels.text.stroke',
                                stylers: [{ color: '#ebe3cd' }]
                            }, {
                                featureType: 'transit.station',
                                elementType: 'geometry',
                                stylers: [{ color: '#dfd2ae' }]
                            }, {
                                featureType: 'water',
                                elementType: 'geometry.fill',
                                stylers: [{ color: '#b9d3c2' }]
                            }, {
                                featureType: 'water',
                                elementType: 'labels.text.fill',
                                stylers: [{ color: '#92998d' }]
                            }
                        ]
                    });
                    // }
                    var myControl = document.getElementById('myTextDiv');
                    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(myControl);
                    if ($scope.zones.geometry) {
                        $scope.drawZone($scope.zones, true);
                        $scope.lat = $scope.zones.geometry[0].lat;
                        $scope.lng = $scope.zones.geometry[0].lng;
                        $scope.temp.zoneName = $scope.zones.name;
                        $scope.zones.users.forEach(function(zUsers) {
                            var zoneOBJ = {};
                            zoneOBJ.user_id = zUsers.user_id._id;
                            zoneOBJ.partner_id = zUsers.partner_id._id;
                            $scope.temp.zoneUsers.push(zoneOBJ);
                        });
                        $scope.getAllUsers = true;
                        $scope.temp.existingPartners = $scope.zones.partners;
                        $scope.setData($scope.temp.existingPartners);
                    }

                    map.setCenter({ lat: $scope.lat, lng: $scope.lng });
                    $timeout(function() {
                        google.maps.event.trigger(map, 'resize');
                    }, 1000);

                    drawingManager = new google.maps.drawing.DrawingManager({
                        drawingControl: true,
                        drawingMode: google.maps.drawing.OverlayType.NULL,
                        drawingControlOptions: {
                            position: google.maps.ControlPosition.TOP_CENTER,
                            drawingModes: ['circle', 'polygon']
                        },
                        polygonOptions: {
                            fillColor: '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        },
                        circleOptions: {
                            fillColor: 'green',
                            fillOpacity: 0.35,
                            strokeColor: 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    });
                    drawingManager.setMap(map);
                    drawingManager.addListener('overlaycomplete', function(e) {
                        drawingManager.setDrawingMode(null);
                        drawingManager.setOptions({ drawingControl: false });
                        defaultShape = e.overlay;
                        defaultShape.type = e.type;
                    });
                }

                function setShapeData(shapeObj) {
                    var shapeJSON = {};
                    var latlng = [];
                    var geometry = [];
                    if (shapeObj.type == 'polygon') {
                        latlng = shapeObj.getPath().getArray();
                        shapeJSON.properties = {
                            fillColor: '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    }
                    if (shapeObj.type == 'circle') {
                        latlng.push(shapeObj.getCenter());
                        shapeJSON.properties = {
                            radius: shapeObj.getRadius(),
                            fillColor: 'green',
                            fillOpacity: 0.35,
                            strokeColor: 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    }

                    latlng.forEach(obj => {
                        var temp = {
                            lat: obj.lat(),
                            lng: obj.lng()
                        }
                        geometry.push(temp);
                    });
                    shapeJSON.geometry = geometry;
                    shapeJSON.type = shapeObj.type;
                    return shapeJSON;
                }

                $scope.selectAll = function(checkAll, phleboArray) {
                    phleboArray.forEach(function(obj) {
                        if (checkAll) {
                            var tempObj = {};
                            obj.isCheck = true;
                            tempObj.user_id = obj._id;
                            tempObj.partner_id = $scope.temp.partner_id;
                            $scope.temp.users.push(tempObj);
                        } else {
                            $scope.temp.users = [];
                            obj.isCheck = false;
                        }
                    });
                    var uniqUsers = _.uniq($scope.temp.users, function(v){ return v.user_id + ' ' + v.partner_id});
                    $scope.temp.users = uniqUsers;
                }

                $scope.selectPhlebo = function(phleboCheck, phlebo) {
                        if (phleboCheck) {
                            $scope.phlebos.forEach(function(obj) {
                                if (obj._id == phlebo._id) {
                                    var tempObj = {};
                                    obj.isCheck = true;
                                    tempObj.user_id = obj._id;
                                    tempObj.partner_id = $scope.temp.partner_id;
                                    $scope.temp.users.push(tempObj);
                                }
                            });
                        } else {
                            phlebo.isCheck = false;
                            $scope.temp.users.forEach(function(obj, $index) {
                                if (obj.user_id == phlebo._id)
                                    $scope.temp.users.splice($index, 1);
                            });
                        }
                        var uniqUsers = _.uniq($scope.temp.users, function(v){ return v.user_id + ' ' + v.partner_id});
                        $scope.temp.users = uniqUsers;
                    }
                    //existing partners
                $scope.selectAllforPartner = function(check, partner) {
                    if (check) {
                        partner.phlebos.forEach(function(obj) {
                            var tempObj = {};
                            obj.isCheck = true;
                            tempObj.user_id = obj._id;
                            tempObj.partner_id = partner._id;
                            $scope.temp.zoneUsers.push(tempObj);
                        })
                    } else {
                        $scope.temp.zoneUsers = [];
                    }
                    var uniqUsers = _.uniq($scope.temp.zoneUsers, function(v){ return v.user_id + ' ' + v.partner_id});
                    $scope.temp.zoneUsers = uniqUsers;
                }

                $scope.selectPartnerPhlebo = function(check, phlebo) {
                    $scope.temp.existingPartners.forEach(function(obj) {
                        obj.phlebos.forEach(function(phleboObj) {
                            if (phleboObj._id == phlebo._id) {
                                if (check) {
                                    var tempObj = {};
                                    phleboObj.isCheck = true;
                                    tempObj.user_id = phleboObj._id;
                                    tempObj.partner_id = obj._id;
                                    $scope.temp.zoneUsers.push(tempObj);
                                } else {
                                    phleboObj.isCheck = false;
                                    $scope.temp.zoneUsers.forEach(function(obj, $index) {
                                        if (obj.user_id == phleboObj._id)
                                            $scope.temp.zoneUsers.splice($index, 1);
                                    });
                                }
                            }
                        })
                    })

                    var uniqUsers = _.uniq($scope.temp.zoneUsers, function(v){ return v.user_id + ' ' + v.partner_id});
                    console.log(uniqUsers);
                    $scope.temp.zoneUsers = uniqUsers;
                }

                $scope.saveCurrentZone = function() {
                    if (defaultShape) {
                        var shapeFeature = setShapeData(defaultShape);
                        shapeFeature.name = $scope.temp.zoneName;
                        if ($scope.zones._id) {
                            $scope.zones.geometry = shapeFeature.geometry;
                            $scope.zones.properties = shapeFeature.properties;
                            $scope.zones.name = shapeFeature.name;
                            $scope.zones.type = shapeFeature.type;
                        } else {
                            $scope.zones = shapeFeature; //for new zone
                        }

                        if ($scope.temp.zoneUsers.length) {
                            $scope.zones.users = $scope.temp.zoneUsers.concat($scope.temp.users);
                        } else {
                            $scope.zones.users = $scope.temp.users;
                        }
                        $scope.saveZone({ zones: $scope.zones });
                        $scope.temp.zoneName = "";
                        $scope.temp.partner = "";
                        $scope.phlebos = [];
                        $scope.temp.existingPartners = [];
                        shapeFeature = {};
                        defaultShape.setMap(null);
                    }
                }

                $scope.clearZone = function() {
                    if (defaultShape) {
                        defaultShape.setMap(null);
                        $scope.temp.currentAreaName = "";
                        defaultShape = undefined;
                        drawingManager.setOptions({ drawingControl: true });
                    }
                }

                $scope.drawZone = function(zone, isEditable) {
                    if (zone.type == 'circle') {
                        defaultShape = new google.maps.Circle({
                            radius: zone.properties.radius || 150,
                            center: zone.geometry[0],
                            fillColor: zone.properties.fillColor || 'green',
                            fillOpacity: 0.35,
                            strokeColor: zone.properties.strokeColor || 'green',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                        defaultShape.setMap(map);
                        defaultShape.type = zone.type;
                    }

                    if (zone.type == 'polygon') {
                        defaultShape = new google.maps.Polygon({
                            paths: zone.geometry,
                            fillColor: zone.properties.fillColor || '#FF0000',
                            fillOpacity: 0.35,
                            strokeColor: zone.properties.strokeColor || '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                        defaultShape.setMap(map);
                        defaultShape.type = zone.type;
                    }
                }

                $scope.setData = function(partners) {
                    partners.forEach(function(obj, index) {
                        $scope.getUsers({ partnerID: obj._id }).then(function(users) {
                            obj.phlebos = users;
                        }, function(err) {
                            window.alert(err);
                        });
                    })

                    console.log(partners);
                }



                $scope.$watch("temp.partner", function(newValue, oldValue) {
                    var search = {};
                    if($scope.temp.partner){
                        search.name = $scope.temp.partner;
                        $scope.getPartner(search).then(function(partners) {
                            $scope.partners = partners;
                            if ($scope.temp.partner)
                            $scope.getAllUsers = false;
                        }, function(err) {
                            debugger
                            window.alert(err);
                        });
                    }
                    //This gets called when data changes.
                });

                $scope.$watch("temp.partner_id", function(newValue, oldValue) {
                    $scope.getUsers({ partnerID: $scope.temp.partner_id });

                    //This gets called when data changes.
                });

                $scope.$watch("phlebos", function(newValue, oldValue) {
                    if ($scope.phlebos.length && $scope.getAllUsers == true) {
                        $scope.temp.existingPartners.forEach(function(partner) {
                            if (partner.phlebos) {
                                partner.phlebos.forEach(function(phleboObj) {
                                    $scope.temp.zoneUsers.forEach(function(zUsers) {
                                        if (zUsers.user_id == phleboObj._id) {
                                            phleboObj.isCheck = true;
                                        }
                                    })
                                })
                            }
                        })
                    }
                    $scope.temp.selectAllPhlebo = false; // uncheck select all checkbox
                    var tempArray = angular.copy($scope.temp.users);
                    for (const phlebo of $scope.phlebos) {
                        for (const user of tempArray) {
                            if (user.user_id == phlebo._id) {
                                phlebo.isCheck = true;
                                var tempObj = {};
                                tempObj.user_id = phlebo._id;
                                tempObj.partner_id = $scope.temp.partner_id;
                                $scope.temp.users.push(tempObj);
                            }
                        }
                    }
                });

                $scope.partnerExist = function(partner){
                    debugger;
                    if($scope.temp.existingPartners.length){
                        $scope.temp.existingPartners.forEach(function (p){
                            if(p.info.name == partner.info.name){
                                $scope.partners = [];
                                $scope.temp.patrner_id = "";
                                $scope.temp.partner = "";
                                var x = document.getElementById("partnerExist")
                                x.className = "show";
                                $timeout(function() { x.className = x.className.replace("show", ""); }, 2000);
                            }
                        })
                    }
                }

                $scope.showMap();
            }]
        }
    })

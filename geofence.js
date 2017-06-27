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
            templateUrl: "geofence.html",
            controller: ['$scope', '$timeout', function($scope, $timeout, $watch) {

                // googlemap variables //
                $scope.temp = {};
                var markers = [];
                var defaultShape;
                var drawingManager;
                $scope.temp.selectAllPhlebo = false;
                $scope.temp.partnerExist = false; //while searching partner in existing
                $scope.temp.noUser = false;
                $scope.temp.noShape = false;
                $scope.temp.users = [];
                $scope.temp.zoneUsers = []; //for existing partners
                $scope.temp.existingPartners = [];
                $scope.temp.currentPartners = [];
                var overlays = [];
                var userOverlays = []; //to draw and hide the shape
                $scope.lat = 19.119126;
                $scope.lng = 72.890775;
                $scope.getAllUsers = false;

                var lineSymbol = {
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
                        zoom: 14,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        streetViewControl: false,
                        mapTypeControl: false
                    });
                    // }
                    var myControl = document.getElementById('myTextDiv');
                    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(myControl);

                    drawingManager = new google.maps.drawing.DrawingManager({
                        drawingControl: true,
                        drawingMode: google.maps.drawing.OverlayType.NULL,
                        drawingControlOptions: {
                            position: google.maps.ControlPosition.TOP_RIGHT,
                            drawingModes: ['circle', 'polygon']
                        },
                        polygonOptions: {
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        },
                        circleOptions: {
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    });
                    drawingManager.setMap(map);

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
                        drawingManager.setOptions({ drawingControl: false });
                        document.getElementById("geo-input").style.display = "none";  // to hide the searchbox when shape is present
                    }

                    // map.setCenter({ lat: $scope.lat, lng: $scope.lng });
                    $timeout(function() {
                        google.maps.event.trigger(map, 'resize');
                    }, 1000);

                    // Create the search box and link it to the UI element.
                    var input = document.getElementById('geo-input');
                    var options = { componentRestrictions: {country: 'in'}};
                    var searchBox = new google.maps.places.Autocomplete(input, options);
                    // var searchBox = new google.maps.places.SearchBox(input);
                    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

                    // Bias the SearchBox results towards current map's viewport.
                    map.addListener('bounds_changed', function () {
                        searchBox.setBounds(map.getBounds());
                    });

                    searchBox.addListener('place_changed', function () {
                        var place = searchBox.getPlace();
                        $scope.temp.selectedArea = place;
                        map.fitBounds($scope.temp.selectedArea.geometry.viewport);
                        map.setCenter($scope.temp.selectedArea.geometry.location);
                        map.setZoom(14);
                    });

                    drawingManager.addListener('overlaycomplete', function(e) {
                        drawingManager.setDrawingMode(null);
                        drawingManager.setOptions({ drawingControl: false });
                        document.getElementById("geo-input").style.display = "none";
                        defaultShape = e.overlay;
                        defaultShape.type = e.type;
                        // $scope.shape = defaultShape;
                    });
                }

                function setShapeData(shapeObj) {
                    var shapeJSON = {};
                    var latlng = [];
                    var geometry = [];
                    if (shapeObj.type == 'polygon') {
                        latlng = shapeObj.getPath().getArray();
                        shapeJSON.properties = {
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
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
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: true,
                            draggable: true
                        }
                    }

                    latlng.forEach(function(obj) {
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

                $scope.selectAll = function(checkAll, phleboArray, partner) {
                    phleboArray.forEach(function(obj) {
                        if (checkAll) {
                            var tempObj = {};
                            obj.isCheck = true;
                            tempObj.user_id = obj._id;
                            tempObj.partner_id = partner.partner._id;
                            $scope.temp.users.push(tempObj);
                        } else {
                            obj.isCheck = false;
                            $scope.temp.users.forEach(function(u, $index) {
                                if (u.patrner_id == partner.partner._id) {
                                    $scope.temp.users.splice($index, 1);
                                }
                            })
                        }
                    });
                    var uniqUsers = _.uniqWith($scope.temp.users, _.isEqual);
                    $scope.temp.users = uniqUsers;
                }

                $scope.selectPhlebo = function(phleboCheck, phlebo, partner) {
                    if (phleboCheck) {
                        var tempObj = {};
                        phlebo.isCheck = true;
                        tempObj.user_id = phlebo._id;
                        tempObj.partner_id = partner.partner._id;
                        $scope.temp.users.push(tempObj);
                    } else {
                        phlebo.isCheck = false;
                        $scope.temp.users.forEach(function(obj, $index) {
                            if (obj.user_id == phlebo._id && obj.partner_id == partner.partner._id)
                                $scope.temp.users.splice($index, 1);
                        });
                    }
                    var uniqUsers = _.uniqWith($scope.temp.users, _.isEqual);
                    $scope.temp.users = uniqUsers;
                }

                //existing partners
                $scope.selectAllExistPartner = function(check, phlebo, partner) {
                    phlebo.forEach(function(obj){
                        if(check){
                            var tempObj = {};
                            obj.isCheck = true;
                            tempObj.user_id = obj._id;
                            tempObj.partner_id = partner._id;
                            $scope.temp.zoneUsers.push(tempObj);
                        }
                        else{
                            obj.isCheck = false;
                            $scope.temp.zoneUsers.forEach(function(u, $index) {
                                if (u.partner_id == partner._id) {
                                    $scope.temp.zoneUsers.splice($index, 1);
                                }
                            });
                        }
                    })

                    var uniqUsers = _.uniqWith($scope.temp.zoneUsers, _.isEqual);
                    // var uniqUsers = _.uniq($scope.temp.zoneUsers, function(v, user_id, patrner_id) {
                    //     return (v.user_id && v.partner_id) });
                    $scope.temp.zoneUsers = uniqUsers;
                }

                $scope.selectPartnerPhlebo = function(check, phlebo, partner) {
                    $scope.temp.existingPartners.forEach(function(obj) {
                        obj.phlebos.forEach(function(phleboObj) {
                            if (phleboObj._id == phlebo._id && partner._id == obj._id) {
                                if (check) {
                                    var tempObj = {};
                                    phleboObj.isCheck = true;
                                    tempObj.user_id = phleboObj._id;
                                    tempObj.partner_id = obj._id;
                                    $scope.temp.zoneUsers.push(tempObj);
                                } else {
                                    phleboObj.isCheck = false;
                                    $scope.temp.zoneUsers.forEach(function(obj, $index) {
                                        if (obj.user_id == phleboObj._id && obj.partner_id == partner._id)
                                            $scope.temp.zoneUsers.splice($index, 1);
                                    });
                                }
                            }
                        })
                    })

                    var uniqUsers = _.uniqWith($scope.temp.zoneUsers, _.isEqual);
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
                        if (!$scope.zones.users.length) {
                            $scope.temp.noUser = true;
                        } else {
                            $scope.saveZone({ zones: $scope.zones });
                            $scope.temp.zoneName = "";
                            $scope.temp.partner = "";
                            $scope.phlebos = [];
                            $scope.temp.currentPartners = [];
                            $scope.temp.existingPartners = [];
                            shapeFeature = {};
                            $scope.temp.selectAllPhlebo = false;
                            $scope.temp.noUser = false;
                            $scope.temp.noShape = false;
                            document.getElementById("geo-input").style.display = "inherit";
                            $scope.temp.users = [];
                            $scope.temp.zoneUsers = []; //for existing partners
                            defaultShape.setMap(null);
                            defaultShape = undefined;
                            drawingManager.setOptions({ drawingControl: true });
                        }
                    } else {
                        $scope.temp.noShape = true;
                    }
                }

                $scope.clearZone = function() {
                    if (defaultShape) {
                        $scope.shape = undefined;
                        defaultShape.setMap(null);
                        $scope.temp.currentAreaName = "";
                        defaultShape = undefined;
                        document.getElementById("geo-input").style.display = "inherit";
                        drawingManager.setOptions({ drawingControl: true });
                    }
                }

                $scope.drawZone = function(zone, isEditable) {
                    if (zone.type == 'circle') {
                        defaultShape = new google.maps.Circle({
                            radius: zone.properties.radius || 150,
                            center: zone.geometry[0],
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                        defaultShape.setMap(map);
                        defaultShape.type = zone.type;
                        map.fitBounds(defaultShape.getBounds()); // to set whole shape on map
                    }

                    if (zone.type == 'polygon') {
                        defaultShape = new google.maps.Polygon({
                            paths: zone.geometry,
                            fillColor: 'red',
                            fillOpacity: 0.35,
                            strokeColor: 'red',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            editable: isEditable || false,
                            draggable: isEditable || false
                        });
                        defaultShape.setMap(map);
                        defaultShape.type = zone.type;
                        var bounds = new google.maps.LatLngBounds();
                        for (var i = 0; i < zone.geometry.length; i++) {
                            var points = new google.maps.LatLng(zone.geometry[i], zone.geometry[i]);
                            bounds.extend(points);
                        }
                        map.fitBounds(bounds);
                    }
                    // $scope.shape = defaultShape;
                }

                $scope.setData = function(partners) {
                    partners.forEach(function(obj, index) {
                        var search = {};
                        search.partnerID = obj._id;
                        $scope.getUsers(search).then(function(users) {
                            obj.phlebos = users;
                            obj.phlebos.forEach(function(pUser) {
                                $scope.temp.zoneUsers.forEach(function(zUsers) {
                                    if (zUsers.user_id == pUser._id && obj._id == zUsers.partner_id) {
                                        pUser.isCheck = true;
                                    }
                                })
                            })
                        }, function(err) {
                            window.alert(err);
                        });
                    });
                }


                $scope.getPartnerByName = function(searchText) {
                    var search = {};
                    search.name = searchText;
                    $scope.getPartner(search).then(function(partners) {
                        $scope.partners = partners;
                        if ($scope.temp.partner)
                            $scope.getAllUsers = false;
                    }, function(err) {
                        window.alert(err);
                    });
                }



                $scope.getPartnerUser = function(p) {
                    if (!$scope.temp.existingPartners.length) {
                        var search = {};
                        search.partnerID = p._id;
                        $scope.getUsers(search).then(function(users) {
                            $scope.phlebos = users;
                            $scope.temp.partner = "";
                            $scope.partners = [];
                            $scope.pushPartner(p);
                        });
                    } else {
                        var foundSearch = false;
                        for (var i = 0; i < $scope.temp.existingPartners.length; i++) {
                            if ($scope.temp.existingPartners[i].info.name == p.info.name) {
                                foundSearch = true;
                                $scope.temp.partner = "";
                                $scope.temp.partnerExist = true;
                                $scope.partners = [];
                                break;
                            }
                        }
                        if (foundSearch == false) {
                            var search = {};
                            search.partnerID = p._id;
                            $scope.getUsers(search).then(function(users) {
                                $scope.phlebos = users;
                                $scope.temp.partner = "";
                                $scope.partners = [];
                                $scope.pushPartner(p);
                            });
                        }
                    }
                }

                $scope.pushPartner = function(pr) {
                    var tempObj = {};
                    tempObj.partner = pr;
                    tempObj.phlebos = $scope.phlebos;

                    if (!$scope.temp.currentPartners.length) {
                        $scope.temp.currentPartners.push(tempObj);
                    } else {
                        var foundSearch = false;
                        for (var i = 0; i < $scope.temp.currentPartners.length; i++) {
                            if ($scope.temp.currentPartners[i].partner._id == pr._id) {
                                foundSearch = true;
                                break;
                            }
                        }
                        if (foundSearch == false) {
                            $scope.temp.currentPartners.push(tempObj);
                        }
                    }
                }

                $scope.removePartner = function(p, index) {
                    $scope.temp.currentPartners.splice(index, 1);
                    $scope.temp.users.forEach(function(u, $index) {
                        if (u.partner_id == p.partner._id) {
                            $scope.temp.users.splice($index, 1);
                        }
                    })
                }

                $scope.removeExistPartner = function(p, index){
                    $scope.temp.existingPartners.splice(index, 1);
                    $scope.temp.zoneUsers.forEach(function(u, $index){
                        if(u.partner_id == p._id){
                            $scope.temp.zoneUsers.splice($index, 1);
                        }
                    })
                }

                $scope.showMap();
            }]
        }
    })

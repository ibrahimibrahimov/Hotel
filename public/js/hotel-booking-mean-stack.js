/*! hotel-booking-mean-stack - v1.0.0 - 2022-05-04 */(function () {
	angular
		.module("common-controllers", [])
		.config([
			"$routeProvider",
			"$locationProvider",
			function ($routeProvider, $locationProvider) {
				$routeProvider
					.when("/profile", {
						templateUrl: "/templates/profile.html",
						controller: "ProfileController",
						controllerAs: "profile",
					})
					.when("/signup", {
						templateUrl: "/templates/signup.html",
						controller: "SignUpController",
						controllerAs: "signUp",
						caseInsensitiveMatch: true,
					})
					.when("/login", {
						templateUrl: "/templates/login.html",
						controller: "LoginController",
						controllerAs: "login",
						caseInsensitiveMatch: true,
					})
					.when("/view-hotel/:id", {
						templateUrl: "/templates/hotel.html",
						controller: "HotelController",
						controllerAs: "hotel",
					})
					.when("/admin", {
						templateUrl: "/templates/admin.html",
						controller: "AdminController",
						controllerAs: "admin",
						resolve: {
							validate: function ($q, $location, SessionService) {
								var validateAccess = $q.defer();
								var isAllowed = SessionService.isAdmin;

								if (!isAllowed) {
									$location.path("/profile");
								}

								validateAccess.resolve();
								return validateAccess.promise;
							},
						},
					})
					.otherwise({
						templateUrl: "/templates/landing.html",
						controller: "IndexController",
						controllerAs: "index",
					});
				$locationProvider.html5Mode(true);
			},
		])
		.controller("IndexController", [
			"$scope",
			"$window",
			"SessionService",
			function ($scope, $window, sessionService) {
				$scope.session = sessionService;
				sessionService.authSuccess($window.user);
				$scope.logout = function () {
					sessionService.logout();
				};
			},
		])
		.controller("LoginController", [
			"$scope",
			"$location",
			"SessionService",
			"growl",
			function ($scope, $location, sessionService, growl) {
				$scope.login = function () {
					sessionService.login(this.email, this.password).then(function (data) {
						if (!data.error) {
							sessionService.authSuccess(data);
							if (data.isAdmin) {
								$location.path("/admin");
							} else {
								$location.path("/profile");
							}
						} else {
							growl.addErrorMessage(data.error);
						}
					});
				};
			},
		])
		.controller("SignUpController", [
			"$scope",
			"UserService",
			function ($scope, userService) {
				$scope.signUp = function () {
					var user = {
						email: this.email,
						password: this.password,
						firstName: this.firstName,
						lastName: this.lastName,
					};
					userService.create(user).then(function (data) {});
				};
			},
		])
		.controller("AdminController", [
			"$scope",
			"$location",
			"HotelService",
			"UserService",
			function ($scope, $location, hotelService, userService) {
				$scope.hotels = {};
				$scope.users = {};
				$scope.newHotel = {};

				$scope.init = function () {
					$scope.newHotel = {};
					userService.get().then(function (data) {
						$scope.users = data;
					});
					hotelService.get().then(function (data) {
						$scope.hotels = data;
					});
				};

				$scope.createHotel = function () {
					$scope.hotelForm.submitAttempt = true;
					if ($scope.hotelForm.$valid) {
						$scope.addHotel = false;
						hotelService.create($scope.newHotel);
						$scope.init();
					}
				};

				$scope.deleteUser = function (id) {
					userService.delete(id).then(function () {
						$scope.init();
					});
				};

				$scope.deleteHotel = function (id) {
					hotelService.delete(id).then(function () {
						$scope.init();
					});
				};
			},
		])
		.controller("ProfileController", [
			"$scope",
			"HotelService",
			"UserService",
			"SessionService",
			"BookingService",
			function ($scope, hotelService, userService, sessionService, bookingService) {
				$scope.hotels = {};
				$scope.bookings = {};
				$scope.term = hotelService.term;

				$scope.getById = function (arr, id) {
					for (var d = 0, len = arr.length; d < len; d += 1) {
						if (arr[d]._id === id) {
							return arr[d];
						}
					}
				};

				$scope.init = function () {
					bookingService.get().then(function (data) {
						var bookings = data;
						if (bookings) {
							hotelService.get().then(function (dataHotels) {
								for (var i = 0; i < bookings.length; i += 1) {
									var booking = bookings[i];
									bookings[i].hotel = $scope.getById(dataHotels, booking.hotel);
								}
								$scope.bookings = bookings;
							});
						}
					});
				};

				$scope.searchHotels = function () {
					hotelService.search(this.term).then(function (data) {
						if (data.length > 0) {
							$scope.hotels = data;
							hotelService.term = $scope.term;
						}
					});
				};

				$scope.cancelBooking = function (id) {
					bookingService.delete(id).then(function (data) {
						$scope.init();
					});
				};
			},
		])
		.controller("HotelController", [
			"$scope",
			"$locale",
			"$location",
			"HotelService",
			"BookingService",
			function ($scope, $locale, $location, hotelService, bookingService) {
				$scope.booking = { type: undefined };
				$scope.currentYear = new Date().getFullYear();
				$scope.currentMonth = new Date().getMonth() + 1;
				$scope.months = $locale.DATETIME_FORMATS.MONTH;

				$scope.options = [
					{
						name: "Single Bed",
						type: "basic",
					},
					{
						name: "Double Bed",
						type: "basic",
					},
					{
						name: "Double Bed",
						type: "deluxe",
					},
					{
						name: "King Size Bed",
						type: "Maharaja",
					},
					{
						name: "Suite",
						type: "Lake View",
					},
				];

				$scope.$on("$routeChangeSuccess", function (event, current, previous) {
					$scope.init(current.pathParams.id);
					event.preventDefault();
				});

				$scope.init = function (hotelId) {
					hotelService.getHotel(hotelId).then(function (data) {
						$scope.hotel = data;
					});
				};

				$scope.bookHotel = function () {
					var newBooking = {
						month: $scope.booking.month,
						year: $scope.booking.year,
						roomType: $scope.booking.roomType.type,
						creditCard: $scope.booking.creditCard,
						securityCode: $scope.booking.securityCode,
						checkOutDate: $scope.booking.checkOutDate,
						checkInDate: $scope.booking.checkInDate,
						creditCardName: $scope.booking.creditCardName,
						hotel: $scope.hotel,
					};
					bookingService.create(newBooking).then(function (data) {});
				};

				$scope.backToSearch = function () {
					$location.path("/profile");
				};

				$scope.proceed = function () {
					if ($scope.paymentForm.$valid) {
						$scope.confirmBooking = true;
					}
				};
			},
		]);
})();
;(function () {
	angular
		.module("common-directives", [])
		.directive("redir", [
			"$http",
			function ($http) {
				return {
					restrict: "A",
					link: function (scope, element, attrs) {
						element.on("click", function (e) {
							e.preventDefault();
							window.location = attrs.href;
						});
					},
				};
			},
		])
		.directive("logout", [
			"$http",
			function ($http) {
				return {
					restrict: "A",
					link: function (scope, element, attrs) {
						element.on("click", function (e) {
							e.preventDefault();
							$http.post("/logout");
						});
					},
				};
			},
		])
		.directive("creditCardType", function () {
			return {
				require: "ngModel",
				link: function (scope, elm, attrs, ctrl) {
					ctrl.$parsers.unshift(function (value) {
						scope.booking.type = /^5[1-5]/.test(value)
							? "fa fa-cc-mastercard"
							: /^4/.test(value)
							? "fa fa-cc-visa"
							: /^3[47]/.test(value)
							? "fa fa-cc-amex"
							: /^6011|65|64[4-9]|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))/.test(value)
							? "fa fa-cc-discover"
							: undefined;
						ctrl.$setValidity("invalid", !!scope.booking.type);
						return value;
					});
				},
			};
		})
		.directive("cardExpiration", function () {
			return {
				require: "ngModel",
				link: function (scope, elm, attrs, ctrl) {
					scope.$watch(
						"[booking.month,booking.year]",
						function (value) {
							ctrl.$setValidity("invalid", true);
							if (
								parseInt(scope.booking.year) === scope.currentYear &&
								scope.booking.month <= scope.currentMonth
							) {
								ctrl.$setValidity("invalid", false);
							}
							return value;
						},
						true,
					);
				},
			};
		});
})();
;(function () {
	angular
		.module("common-factories", [])
		.factory("transformRequestAsFormPost", function () {
			function serializeData(data) {
				if (!angular.isObject(data)) {
					return data == null ? "" : data.toString();
				}

				var buffer = [];

				for (var name in data) {
					if (!data.hasOwnProperty(name)) {
						continue;
					}
					var value = data[name];
					buffer.push(encodeURIComponent(name) + "=" + encodeURIComponent(value == null ? "" : value));
				}

				var source = buffer.join("&").replace(/%20/g, "+");
				return source;
			}

			function transformRequest(data, getHeaders) {
				var headers = getHeaders();
				headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
				return serializeData(data);
			}

			return transformRequest;
		})
		.factory("myHttpResponseInterceptor", [
			"$q",
			"$location",
			"growl",
			function ($q, $location, growl) {
				return {
					response: function (response) {
						if (typeof response.data === "object") {
							if (response.data.redirect) {
								$location.path(response.data.redirect);
								return {} || $q.when(response);
							} else if (response.data.error) {
								growl.addErrorMessage(response.data.error);
							}
						}
						return response || $q.when(response);
					},
				};
			},
		])
		.config([
			"$httpProvider",
			function ($httpProvider) {
				$httpProvider.interceptors.push("myHttpResponseInterceptor");
			},
		]);
})();
;(function () {
	angular.module("common-filters", []).filter("range", function () {
		var filter = function (arr, lower, upper) {
			for (var i = lower; i <= upper; i++) {
				arr.push(i);
			}
			return arr;
		};
		return filter;
	});
})();
;(function () {
	angular
		.module("common-services", [])
		.factory("SessionService", [
			"$rootScope",
			"$http",
			"$location",
			"$q",
			function ($rootScope, $http, $location, $q) {
				var session = {
					init: function () {
						this.resetSession();
					},
					resetSession: function () {
						this.currentUser = null;
						this.isAdmin = false;
						this.isLoggedIn = false;
						window.user = {};
					},
					login: function (email, password) {
						return $http
							.post("/login", {
								email: email,
								password: password,
							})
							.then(function (response) {
								return response.data;
							});
					},
					logout: function () {
						var scope = this;
						$http
							.post("/logout")
							.then(function (response) {
								return response.data;
							})
							.then(function (data) {
								if (data.success) {
									scope.resetSession();
									$location.path("/index");
								}
							});
					},
					isAdminLoggedIn: function () {
						$http.get("/api/userData/").then(function (data) {
							var validateAccess = $q.defer();
							var isAllowed = data.isAdmin;

							if (!isAllowed) {
								$location.path("/profile");
							}

							validateAccess.resolve();
							return validateAccess.promise;
						});
					},
					authSuccess: function (userData) {
						if (Object.keys(userData).length > 0) {
							this.currentUser = userData;
							this.isAdmin = userData.isAdmin;
							this.isLoggedIn = true;
						}
					},
					authFailed: function () {
						this.resetSession();
						console.log("Authentication failed");
					},
				};
				session.init();
				return session;
			},
		])
		.factory("HotelService", [
			"$rootScope",
			"$http",
			function ($rootScope, $http) {
				return {
					term: null,
					get: function () {
						return $http.get("/api/hotels/").then(function (response) {
							return response.data;
						});
					},
					getHotel: function (id) {
						return $http.get("/api/hotels/" + id).then(function (response) {
							return response.data;
						});
					},
					create: function (hotelData) {
						return $http.post("/api/admin/hotels", hotelData);
					},
					delete: function (id) {
						return $http.delete("/api/admin/hotels/" + id);
					},
					search: function (term) {
						return $http.post("/api/hotels/search", { term: term }).then(function (response) {
							return response.data;
						});
					},
				};
			},
		])
		.factory("BookingService", [
			"$rootScope",
			"$http",
			function ($rootScope, $http) {
				return {
					get: function () {
						return $http.get("/api/bookings").then(function (response) {
							return response.data;
						});
					},
					create: function (bookingData) {
						return $http.post("/api/bookings", bookingData);
					},
					delete: function (id) {
						return $http.delete("/api/bookings/" + id);
					},
				};
			},
		])
		.factory("UserService", [
			"$rootScope",
			"$http",
			function ($rootScope, $http) {
				return {
					get: function () {
						return $http.get("/api/admin/users/").then(function (response) {
							return response.data;
						});
					},
					create: function (userData) {
						return $http.post("/signup", userData);
					},
					delete: function (id) {
						return $http.delete("/api/admin/users/" + id);
					},
				};
			},
		]);
})();
;(function () {
	/**
	 * angular-growl - v0.4.0 - 2013-11-19
	 * https://github.com/marcorinck/angular-growl
	 * Copyright (c) 2013 Marco Rinck; Licensed MIT
	 */
	angular.module("angular-growl", []);
	angular.module("angular-growl").directive("growl", [
		"$rootScope",
		function ($rootScope) {
			"use strict";
			return {
				restrict: "A",
				template:
					'<div class="growl">' +
					'\t<div class="growl-item alert" ng-repeat="message in messages" ng-class="computeClasses(message)">' +
					'\t\t<button type="button" class="close" ng-click="deleteMessage(message)">&times;</button>' +
					'       <div ng-switch="message.enableHtml">' +
					'           <div ng-switch-when="true" ng-bind-html="message.text"></div>' +
					'           <div ng-switch-default ng-bind="message.text"></div>' +
					"       </div>" +
					"\t</div>" +
					"</div>",
				replace: false,
				scope: true,
				controller: [
					"$scope",
					"$timeout",
					"growl",
					function ($scope, $timeout, growl) {
						var onlyUnique = growl.onlyUnique();
						$scope.messages = [];
						function addMessage(message) {
							$scope.messages.push(message);
							if (message.ttl && message.ttl !== -1) {
								$timeout(function () {
									$scope.deleteMessage(message);
								}, message.ttl);
							}
						}
						$rootScope.$on("growlMessage", function (event, message) {
							var found;
							if (onlyUnique) {
								angular.forEach($scope.messages, function (msg) {
									if (message.text === msg.text && message.severity === msg.severity) {
										found = true;
									}
								});
								if (!found) {
									addMessage(message);
								}
							} else {
								addMessage(message);
							}
						});
						$scope.deleteMessage = function (message) {
							var index = $scope.messages.indexOf(message);
							if (index > -1) {
								$scope.messages.splice(index, 1);
							}
						};
						$scope.computeClasses = function (message) {
							return {
								"alert-success": message.severity === "success",
								"alert-error": message.severity === "error",
								"alert-danger": message.severity === "error",
								"alert-info": message.severity === "info",
								"alert-warning": message.severity === "warn",
							};
						};
					},
				],
			};
		},
	]);
	angular.module("angular-growl").provider("growl", function () {
		"use strict";
		var _ttl = null,
			_enableHtml = false,
			_messagesKey = "messages",
			_messageTextKey = "text",
			_messageSeverityKey = "severity",
			_onlyUniqueMessages = true;
		this.globalTimeToLive = function (ttl) {
			_ttl = ttl;
		};
		this.globalEnableHtml = function (enableHtml) {
			_enableHtml = enableHtml;
		};
		this.messagesKey = function (messagesKey) {
			_messagesKey = messagesKey;
		};
		this.messageTextKey = function (messageTextKey) {
			_messageTextKey = messageTextKey;
		};
		this.messageSeverityKey = function (messageSeverityKey) {
			_messageSeverityKey = messageSeverityKey;
		};
		this.onlyUniqueMessages = function (onlyUniqueMessages) {
			_onlyUniqueMessages = onlyUniqueMessages;
		};
		this.serverMessagesInterceptor = [
			"$q",
			"growl",
			function ($q, growl) {
				function checkResponse(response) {
					if (response.data[_messagesKey] && response.data[_messagesKey].length > 0) {
						growl.addServerMessages(response.data[_messagesKey]);
					}
				}
				function success(response) {
					checkResponse(response);
					return response;
				}
				function error(response) {
					checkResponse(response);
					return $q.reject(response);
				}
				return function (promise) {
					return promise.then(success, error);
				};
			},
		];
		this.$get = [
			"$rootScope",
			"$filter",
			function ($rootScope, $filter) {
				var translate;
				try {
					translate = $filter("translate");
				} catch (e) {}
				function broadcastMessage(message) {
					if (translate) {
						message.text = translate(message.text);
					}
					$rootScope.$broadcast("growlMessage", message);
				}
				function sendMessage(text, config, severity) {
					var _config = config || {},
						message;
					message = {
						text: text,
						severity: severity,
						ttl: _config.ttl || _ttl,
						enableHtml: _config.enableHtml || _enableHtml,
					};
					broadcastMessage(message);
				}
				function addWarnMessage(text, config) {
					sendMessage(text, config, "warn");
				}
				function addErrorMessage(text, config) {
					sendMessage(text, config, "error");
				}
				function addInfoMessage(text, config) {
					sendMessage(text, config, "info");
				}
				function addSuccessMessage(text, config) {
					sendMessage(text, config, "success");
				}
				function addServerMessages(messages) {
					var i, message, severity, length;
					length = messages.length;
					for (i = 0; i < length; i++) {
						message = messages[i];
						if (message[_messageTextKey] && message[_messageSeverityKey]) {
							switch (message[_messageSeverityKey]) {
								case "warn":
									severity = "warn";
									break;
								case "success":
									severity = "success";
									break;
								case "info":
									severity = "info";
									break;
								case "error":
									severity = "error";
									break;
							}
							sendMessage(message[_messageTextKey], undefined, severity);
						}
					}
				}
				function onlyUnique() {
					return _onlyUniqueMessages;
				}
				return {
					addWarnMessage: addWarnMessage,
					addErrorMessage: addErrorMessage,
					addInfoMessage: addInfoMessage,
					addSuccessMessage: addSuccessMessage,
					addServerMessages: addServerMessages,
					onlyUnique: onlyUnique,
				};
			},
		];
	});
})();
;(function () {
	angular.module("HotelApp", [
		"ngResource",
		"ngRoute",
		"ngCookies",
		"common-directives",
		"common-factories",
		"angular-growl",
		"common-filters",
		"common-controllers",
		"common-services",
	]);
})();

const request = require("request-promise");

const outputFormat = "rapidJSON";
const coordOutputFormat = "EPSG:4326";

const stopTypesEnum = {
    any: "any",
    coord: "coord"
}

const depArrMacros = {
    arrive: "arr",
    depart: "dep"
}

const APIPaths = {
    trip: '/trip'
}

const baseApi = 'https://api.transport.nsw.gov.au/v1/tp';

class TripPlannerAPI {

    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    trip(options) {
        // verify the required parameter 'itdDate' is set
        if (options.itdDate === undefined || options.itdDate === null) {
            throw new Error("Missing the required parameter 'itdDate' when calling tfnswTripRequest2");
        }
    
        // verify the required parameter 'itdTime' is set
        if (options.itdTime === undefined || options.itdTime === null) {
            throw new Error("Missing the required parameter 'itdTime' when calling tfnswTripRequest2");
        }
    
        // verify the required parameter 'typeOrigin' is set
        if (options.type_origin === undefined || options.type_origin === null) {
            throw new Error("Missing the required parameter 'typeOrigin' when calling tfnswTripRequest2");
        }
    
        // verify the required parameter 'nameOrigin' is set
        if (options.name_origin === undefined || options.name_origin === null) {
            throw new Error("Missing the required parameter 'nameOrigin' when calling tfnswTripRequest2");
        }
    
        // verify the required parameter 'typeDestination' is set
        if (options.type_destination === undefined || options.type_destination === null) {
            throw new Error("Missing the required parameter 'typeDestination' when calling tfnswTripRequest2");
        }
    
        // verify the required parameter 'nameDestination' is set
        if (options.name_destination === undefined || options.name_destination === null) {
            throw new Error("Missing the required parameter 'nameDestination' when calling tfnswTripRequest2");
        }
        
        const combinedOptions = Object.assign({outputFormat: outputFormat, coordOutputFormat: coordOutputFormat}, options)

        console.log("combinedOpts:", combinedOptions);

        return request({
            method: "GET",
            uri: baseApi + APIPaths.trip,
            // qs: {
            //     itdDate: options.itdDate,
            //     itdTime: options.itdTime,
            //     typeOrigin: options.typeOrigin,
            //     nameOrigin: options.nameOrigin,
            //     typeDestination: options.typeDestination,
            //     nameDestination: options.nameDestination,
            //     calcNumberOfTrips: options.calcNumberOfTrips
            // },
            qs: combinedOptions,
            headers: {
                "Authorization": "apikey " + this.apiKey
            },
            json: true
        })
    }
}



module.exports = {TripPlannerAPI, APIConstants: {
    stopTypes: stopTypesEnum,
    depArrOpts: depArrMacros,
    TripPlannerPaths: APIPaths
}};





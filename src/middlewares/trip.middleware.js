import moment from 'moment';
import response from '../helpers/response.helper';
import tripService from '../services/trip.services';

/**
* Class for users to create trips
*/
class TripMiddleware {
/**
 * this functions checks if the trip requested is already created
 * @param {Object} req req
 * @param {Object} res res
 * @param {Object} next ment
 * @returns {Object} returned
 */
  static async checkTripExist(req, res, next) {
    const { departureDate } = req.body;
    const userId = req.user.id;
    const trip = await tripService.findTrip(userId);
    const foundTrip = trip.filter((trips) => departureDate === moment(trips.departureDate).format('YYYY-MM-DD'));
    if (trip.length === 0 || foundTrip.length === 0) return next();

    const requestUser = await tripService.findRequestByUser(foundTrip[0].tripId);

    if (requestUser[0]) {
      return response.errorMessage(res, 'this trip has been already created', 409);
    }
    return next();
  }

  /** checks if the date is valid if the travel date is not later in the future than the return date
   * @param {Object} req request
   * @param {Object} res response
   * @param {Object} next jumps to the next middleware on the chain
   * @returns {Object} object
   */
  static async checkIfDateisValid(req, res, next) {
    const { departureDate, returnDate, type } = req.body;
    const bodyData = Object.prototype.toString.call(req.body);
    if (bodyData === '[object Array]' || type !== 'round trip') return next();

    const travel = new Date(departureDate);
    const returDate = new Date(returnDate);

    if (travel > returDate) {
      return response.errorMessage(res, 'the departure date cannot be later than the return date', 400);
    }
    return next();
  }

  /** check if the locations are stored in the database
   *  check if the origin is not the same as the destination
   *  @param {req} req it contains the request of the user
   *  @param {res} res it contains the response the user receive
   *  @param {function} next it jumps to the next middleware in the route
   *  @return {object} the data from the first middleware
   */
  static async checkLocations(req, res, next) {
    const { From, To } = req.body;
    const findPlace = await tripService.findSupportedPlaces(From, To);
    if (From === To) return response.errorMessage(res, 'you cannot create  that trip', 403);
    if (findPlace.origin === null) return response.errorMessage(res, 'barefoot nomad does not have an office in that origin', 404);
    if (findPlace.destination === null) return response.errorMessage(res, 'barefoot nomad does not have an office in your destination', 404);
    next();
  }
}
export default TripMiddleware;
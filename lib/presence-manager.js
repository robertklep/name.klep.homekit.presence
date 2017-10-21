const HAS = require('has-node');

module.exports.PresenceManager = class PresenceManager {

  constructor(app) {
    this.app    = app;
    this.server = app.server;
    this.log    = app.log.bind(app);
    this.users  = {};
  }

  idForUser(user) {
    return this.server.config.getHASID(user.id);
  }

  async trackUser(user) {
    if (user.id in this.users) return;
    let characteristic  = await this.createAccessory(user);
    this.users[user.id] = Object.assign({}, user, { characteristic });
    this.log('tracking user', user.name);
  }

  async untrackUser(user) {
    if (! (user.id in this.users)) return;
    this.server.removeAccessory(this.idForUser(user));
    delete this.users[user.id];
    this.log(`not tracking user ${ user.name } anymore`);
  }

  async createAccessory(user) {
    const accessory       = new HAS.Accessory(this.idForUser(user));
    let serviceNum        = 1;
    let characteristicNum = 1;

    // Create accessory information.
    const identify = HAS.predefined.Identify(characteristicNum++, undefined, (value, callback) => callback(HAS.statusCodes.OK));
    accessory.addServices(HAS.predefined.AccessoryInformation(serviceNum++, [
      identify,
      HAS.predefined.Manufacturer(characteristicNum++, 'Athom'),
      HAS.predefined.Model(characteristicNum++, 'Homey Occupancy Sensor'),
      HAS.predefined.Name(characteristicNum++, user.name),
      HAS.predefined.SerialNumber(characteristicNum++, user.id),
      HAS.predefined.FirmwareRevision(characteristicNum++, '1.0.1'),
    ]));

    // Create occupancy sensor.
    const characteristic = HAS.predefined.OccupancyDetected(1, this.stateToValue(false));
    accessory.addServices(HAS.predefined.OccupancySensor(serviceNum++, [ characteristic ]));

    // Add to server.
    this.server.addAccessory(accessory);

    // Return characteristic (used to toggle the state).
    return characteristic;
  }

  async updateState(state) {
    const { user_id, present } = state;
    const user                 = this.users[user_id];

    // Update status if we're tracking this user.
    if (user) {
      user.characteristic.setValue(this.stateToValue(present));
      this.log(`set occupancy state for ${ user.name } (${ user.id }) to ${ present }`);
    }
  }

  stateToValue(state) {
    return state ? 1 : 0;
  }

}

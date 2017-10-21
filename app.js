const Homey               = require('homey');
const HAS                 = require('has-node');
const { HomeyAPI }        = require('./lib/athom-api')
const { PresenceManager } = require('./lib/presence-manager');

const DEBUG = true;

module.exports = class HomeKitPresenceApp extends Homey.App {

  onInit() {
    this.log('HomeKitPresenceApp is running...');
    this.initialize();

    if (DEBUG) {
      this.log('starting inspector');
      require('inspector').open(9229, '0.0.0.0');
    }
  }

  async initialize() {
    await this.initializeHAS();
    await this.initializeManager();
    this.startHAS();
  }

  get api() {
    if (! this._api) {
      this._api = HomeyAPI.forCurrentHomey();
    }
    return this._api;
  }

  async initializeHAS() {
    const config = new HAS.Config('Homey Presence Bridge', '4A:DF:DA:DF:13:37', HAS.categories.bridge, __dirname + '/userdata/has-config.json', 8097, '424-24-242');
    const server = this.server = new HAS.Server(config);

    // Create bridge.
    const bridge = new HAS.Accessory(config.getHASID('91DE53E1-F930-49A7-ADE2-A83012249B19'));
    let identify = HAS.predefined.Identify(1, undefined, (value, callback) => callback(HAS.statusCodes.OK));

    bridge.addServices(HAS.predefined.AccessoryInformation(1, [
      identify,
      HAS.predefined.Manufacturer(2, 'Athom'),
      HAS.predefined.Model(3, 'Homey'),
      HAS.predefined.Name(4, 'Homey Presence Bridge'),
      HAS.predefined.SerialNumber(5, '42DA75AC-9B20-4F56-AE0C-70903D757812'),
      HAS.predefined.FirmwareRevision(6, '1.0.0')
    ]));

    // Add bridge to server.
    server.addAccessory(bridge);

    // server.onIdentify will be used only when server is not paired, If server is paired identify.onWrite will be used
    server.onIdentify = identify.onWrite;
  }

  async initializeManager() {
    const api = await this.api;

    // Instantiate presence manager.
    let manager = this.manager = new PresenceManager(this);

    // Add tracker users to manager.
    let trackedUsers = Homey.ManagerSettings.get('trackedUsers') || [];
    for (let user of trackedUsers) {
      await manager.trackUser(user);
    }

    // Subscribe to presence events.
    await api.presence.subscribe();
    api.presence.on('presence', state => {
//      this.log('change in presence detected', state);
      manager.updateState(state)
    })
  }

  async startHAS() {
    // Start the server
    this.log('starting HAS server');
    this.server.startServer();
  }

  // API methods
  async getUsers() {
    return (await this.api).users.getUsers();
  }

  async trackUser(user) {
    return this.manager.trackUser(user);
  }

  async untrackUser(user) {
    return this.manager.untrackUser(user);
  }

}

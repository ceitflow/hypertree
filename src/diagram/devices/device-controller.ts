import { util } from '@joint/core';
import { ScreenConfig, ScreenType } from '../screen';
import { CreateDeviceType, DeepPartial, DeviceId, DevicesConfig, DeviceType } from './types.ts';

// pass in the theme: new Theme('automatic' | ...)
export function DeviceController(screen: ScreenType) {
  const devices: { [id: DeviceId]: DeviceType } = {};
  const devicesConfig: DevicesConfig = { default: screen.getConfig() }; // initial config is what is currently in screen
  let currentDeviceId: string | undefined;

  const setCurrentDevice = (id: DeviceId): void => {
    if (currentDeviceId === id) return;
    currentDeviceId = id;
    const { config } = devices[id];
    if (config) screen.setConfig(util.defaultsDeep(util.cloneDeep(devicesConfig.default), config) as ScreenConfig);
    else screen.setConfig(devicesConfig.default);
  };

  return {
    add: (createDevice: CreateDeviceType) => {
      const device = createDevice(screen.controller, screen.paper);
      devices[device.id] = device;
      Object.entries(device.listeners).forEach(([type, callback]) => {
        document.addEventListener(
          type,
          e => {
            if (screen.container.contains(e.target as Element)) {
              setCurrentDevice(device.id);
              callback(e);
            }
          },
          { passive: false }
        );
      });
    },

    setConfig: (id: DeviceId, config: DeepPartial<ScreenConfig>): void => {
      devicesConfig[id] = util.defaultsDeep(devicesConfig[id], config);
    },

    remove: (id: DeviceId) => {
      const device = devices[id];
      Object.entries(device.listeners).forEach(([type, callback]) => {
        document.removeEventListener(type, callback);
      });
      delete devices[id];
      delete devicesConfig[id];
      if (currentDeviceId === id) currentDeviceId = undefined;
    },
    /*get: (type: string): DeviceType | undefined => devices.find(d => d.type === type),*/
  };
}

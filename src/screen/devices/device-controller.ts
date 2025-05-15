import { dia } from '@joint/core';
import { Mouse } from './mouse.ts';
import { Touch } from './touch.ts';
import { DeviceType } from './types.ts';
import { InputTransformerType } from '../transformers';

export function DeviceController() {
  const devices: DeviceType[] = [Mouse(), Touch()];

  return {
    init: (input: InputTransformerType, paper: dia.Paper, container: HTMLElement) => {
      devices.forEach(device => {
        const listenerMap = device.init(input, paper);
        Object.entries(listenerMap).forEach(([type, callback]) => {
          document.addEventListener(
            type,
            e => {
              if (container.contains(e.target as Element)) {
                callback(e);
              }
            },
            { passive: false }
          );
        });
      });
    },
    add: (device: DeviceType) => {
      // validate
    },
    remove: (type: string) => {},
    get: (type: string): DeviceType | undefined => devices.find(d => d.type === type),
  };
}

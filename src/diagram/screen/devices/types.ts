import { dia } from '@joint/core';
import { InputControllerType } from '../inputs';

export type DeviceType<C extends object = any> = {
  type: string;
  init: (input: InputControllerType, paper: dia.Paper) => ListenerMap;
  toggle: (on: boolean) => void;
  setConfig: (config: Partial<C>) => void;
};
export type ListenerMap = { [type: string]: (e: any) => void };

import { dia } from '@joint/core';
import { ScreenConfig, ScreenController } from '../screen';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Point = [number, number];

export type CreateDeviceType = (controller: ScreenController, paper: dia.Paper) => DeviceType;
export type DeviceType = {
  id: string;
  listeners: ListenerMap;
  config?: Partial<ScreenConfig>;
};
export type ListenerMap = { [type: string]: (e: any) => void };

export type DeviceId = string;

export type DevicesConfig = {
  default: ScreenConfig;
  [id: DeviceId]: Partial<ScreenConfig>;
}
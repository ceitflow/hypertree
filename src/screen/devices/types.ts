import { dia } from '@joint/core';
import { InputTransformerType } from '../transformers';

export type DeviceType<C extends object = any> = {
  type: string;
  init: (input: InputTransformerType, paper: dia.Paper) => ListenerMap;
  toggle: (on: boolean) => void;
  setConfig: (config: Partial<C>) => void;
};
export type ListenerMap = { [type: string]: (e: any) => void };

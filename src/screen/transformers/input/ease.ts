/* ===========================================================
 * Based on:
 *  Copyright © 2008 George McGinley Smith
 *  All rights reserved.
 *  https://raw.github.com/danro/jquery-easing
 * ======================================================== */

// t: current time, c: 100% of value, d: duration
export class Ease {
  // todo various themes (more like for physics)
  // - glitch like
  // - space like (low gravity)
  // todo matrix demo with falling shapes

  static linear(t: number, c: number, d: number) {
    return c * (t / d);
  }

  static inLog(t: number, c: number, d: number) {
    const result = Math.exp(-Math.E + (t / d) * Math.E); // range [min, 1]
    const min = Math.exp(-Math.E);
    return (c * (result - min)) / (1 - min); // into [0, 1]
  }

  static inQuad(t: number, c: number, d: number) {
    return c * (t /= d) * t;
  }

  static outQuad(t: number, c: number, d: number) {
    return -c * (t /= d) * (t - 2);
  }

  static inOutQuad(t: number, c: number, d: number) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t;
    return (-c / 2) * (--t * (t - 2) - 1);
  }

  static inCubic(t: number, c: number, d: number) {
    return c * (t /= d) * t * t;
  }

  static outCubic(t: number, c: number, d: number) {
    return c * ((t = t / d - 1) * t * t + 1);
  }

  static inOutCubic(t: number, c: number, d: number) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t;
    return (c / 2) * ((t -= 2) * t * t + 2);
  }

  static inQuart(t: number, c: number, d: number) {
    return c * (t /= d) * t * t * t;
  }

  static outQuart(t: number, c: number, d: number) {
    return -c * ((t = t / d - 1) * t * t * t - 1);
  }

  static inOutQuart(t: number, c: number, d: number) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t * t;
    return (-c / 2) * ((t -= 2) * t * t * t - 2);
  }

  static inQuint(t: number, c: number, d: number) {
    return c * (t /= d) * t * t * t * t;
  }

  static outQuint(t: number, c: number, d: number) {
    return c * ((t = t / d - 1) * t * t * t * t + 1);
  }

  static inOutQuint(t: number, c: number, d: number) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t * t * t;
    return (c / 2) * ((t -= 2) * t * t * t * t + 2);
  }

  static inSine(t: number, c: number, d: number) {
    return -c * Math.cos((t / d) * (Math.PI / 2)) + c;
  }

  static outSine(t: number, c: number, d: number) {
    return c * Math.sin((t / d) * (Math.PI / 2));
  }

  static inOutSine(t: number, c: number, d: number) {
    return (-c / 2) * (Math.cos((Math.PI * t) / d) - 1);
  }

  static inExpo(t: number, c: number, d: number) {
    return t == 0 ? 0 : c * Math.pow(2, 10 * (t / d - 1));
  }

  static outExpo(t: number, c: number, d: number) {
    return t == d ? c : c * (-Math.pow(2, (-10 * t) / d) + 1);
  }

  static inOutExpo(t: number, c: number, d: number) {
    if (t == 0) return 0;
    if (t == d) return c;
    if ((t /= d / 2) < 1) return (c / 2) * Math.pow(2, 10 * (t - 1));
    return (c / 2) * (-Math.pow(2, -10 * --t) + 2);
  }

  static inCirc(t: number, c: number, d: number) {
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1);
  }

  static outCirc(t: number, c: number, d: number) {
    return c * Math.sqrt(1 - (t = t / d - 1) * t);
  }

  static inOutCirc(t: number, c: number, d: number) {
    if ((t /= d / 2) < 1) return (-c / 2) * (Math.sqrt(1 - t * t) - 1);
    return (c / 2) * (Math.sqrt(1 - (t -= 2) * t) + 1);
  }

  static inElastic(t: number, c: number, d: number) {
    if (c === 0) return 0;
    let s = 1.70158;
    let p = 0;
    let a = c;
    if (t == 0) return 0;
    if ((t /= d) == 1) return c;
    if (!p) p = d * 0.3;
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else s = (p / (2 * Math.PI)) * Math.asin(c / a);
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin(((t * d - s) * (2 * Math.PI)) / p));
  }

  static outElastic(t: number, c: number, d: number) {
    if (c === 0) return 0;
    let s = 1.70158;
    let p = 0;
    let a = c;
    if (t == 0) return 0;
    if ((t /= d) == 1) return c;
    if (!p) p = d * 0.3;
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else s = (p / (2 * Math.PI)) * Math.asin(c / a);
    return a * Math.pow(2, -10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p) + c;
  }

  static inOutElastic(t: number, c: number, d: number) {
    if (c === 0) return 0;
    let s = 1.70158;
    let p = 0;
    let a = c;
    if (t == 0) return 0;
    if ((t /= d / 2) == 2) return c;
    if (!p) p = d * (0.3 * 1.5);
    if (a < Math.abs(c)) {
      a = c;
      s = p / 4;
    } else s = (p / (2 * Math.PI)) * Math.asin(c / a);
    if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin(((t * d - s) * (2 * Math.PI)) / p));
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin(((t * d - s) * (2 * Math.PI)) / p) * 0.5 + c;
  }

  static inBack(t: number, c: number, d: number) {
    const s = 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s);
  }

  static outBack(t: number, c: number, d: number) {
    const s = 1.70158;
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1);
  }

  static inOutBack(t: number, c: number, d: number) {
    let s = 1.70158;
    if ((t /= d / 2) < 1) return (c / 2) * (t * t * (((s *= 1.525) + 1) * t - s));
    return (c / 2) * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
  }

  static outBounce(t: number, c: number, d: number) {
    if ((t /= d) < 1 / 2.75) {
      return c * (7.5625 * t * t);
    } else if (t < 2 / 2.75) {
      return c * (7.5625 * (t -= 1.5 / 2.75) * t + 0.75);
    } else if (t < 2.5 / 2.75) {
      return c * (7.5625 * (t -= 2.25 / 2.75) * t + 0.9375);
    } else {
      return c * (7.5625 * (t -= 2.625 / 2.75) * t + 0.984375);
    }
  }
}

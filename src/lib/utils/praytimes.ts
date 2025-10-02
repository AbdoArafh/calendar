//--------------------- Copyright Block ----------------------
/* 

PrayTimes.js: Prayer Times Calculator (ver 2.3)
Copyright (C) 2007-2011 PrayTimes.org

Developer: Hamid Zarrabi-Zadeh
License: GNU LGPL v3.0

TERMS OF USE:
	Permission is granted to use this code, with or 
	without modification, in any website or application 
	provided that credit is given to the original work 
	with a link back to PrayTimes.org.

This program is distributed in the hope that it will 
be useful, but WITHOUT ANY WARRANTY. 

PLEASE DO NOT REMOVE THIS COPYRIGHT BLOCK.
 
*/

// Type definitions
type CalculationMethod =
  | "MWL"
  | "ISNA"
  | "Egypt"
  | "Makkah"
  | "Karachi"
  | "Tehran"
  | "Jafari";
type TimeFormat = "24h" | "12h" | "12hNS" | "Float";
type AsrJuristic = "Standard" | "Hanafi";
type HighLatMethod = "NightMiddle" | "AngleBased" | "OneSeventh" | "None";
type MidnightMethod = "Standard" | "Jafari";

interface PrayerTimes {
  imsak: string | number;
  fajr: string | number;
  sunrise: string | number;
  dhuhr: string | number;
  asr: string | number;
  sunset: string | number;
  maghrib: string | number;
  isha: string | number;
  midnight?: string | number;
}

interface MethodParams {
  fajr?: number;
  isha?: number | string;
  maghrib?: number | string;
  midnight?: MidnightMethod;
}

interface Method {
  name: string;
  params: MethodParams;
}

interface Settings {
  imsak: string;
  dhuhr: string;
  asr: AsrJuristic;
  highLats: HighLatMethod;
  fajr?: number;
  isha?: number | string;
  maghrib?: number | string;
  midnight?: MidnightMethod;
}

interface SunPosition {
  declination: number;
  equation: number;
}

interface TimeOffsets {
  [key: string]: number;
}

// Degree-based math utilities
class DegreeMath {
  static dtr(d: number): number {
    return (d * Math.PI) / 180.0;
  }

  static rtd(r: number): number {
    return (r * 180.0) / Math.PI;
  }

  static sin(d: number): number {
    return Math.sin(this.dtr(d));
  }

  static cos(d: number): number {
    return Math.cos(this.dtr(d));
  }

  static tan(d: number): number {
    return Math.tan(this.dtr(d));
  }

  static arcsin(d: number): number {
    return this.rtd(Math.asin(d));
  }

  static arccos(d: number): number {
    return this.rtd(Math.acos(d));
  }

  static arctan(d: number): number {
    return this.rtd(Math.atan(d));
  }

  static arccot(x: number): number {
    return this.rtd(Math.atan(1 / x));
  }

  static arctan2(y: number, x: number): number {
    return this.rtd(Math.atan2(y, x));
  }

  static fixAngle(a: number): number {
    return this.fix(a, 360);
  }

  static fixHour(a: number): number {
    return this.fix(a, 24);
  }

  static fix(a: number, b: number): number {
    a = a - b * Math.floor(a / b);
    return a < 0 ? a + b : a;
  }
}

interface PrayTimesOptions {
  withSuffix?: boolean;
}

export class PrayTimes {
  private static readonly TIME_NAMES = {
    imsak: "Imsak",
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    sunset: "Sunset",
    maghrib: "Maghrib",
    isha: "Isha",
    midnight: "Midnight",
  };

  private static readonly METHODS: Record<CalculationMethod, Method> = {
    MWL: {
      name: "Muslim World League",
      params: { fajr: 18, isha: 17 },
    },
    ISNA: {
      name: "Islamic Society of North America (ISNA)",
      params: { fajr: 15, isha: 15 },
    },
    Egypt: {
      name: "Egyptian General Authority of Survey",
      params: { fajr: 19.5, isha: 17.5 },
    },
    Makkah: {
      name: "Umm Al-Qura University, Makkah",
      params: { fajr: 18.5, isha: "90 min" },
    },
    Karachi: {
      name: "University of Islamic Sciences, Karachi",
      params: { fajr: 18, isha: 18 },
    },
    Tehran: {
      name: "Institute of Geophysics, University of Tehran",
      params: { fajr: 17.7, isha: 14, maghrib: 4.5, midnight: "Jafari" },
    },
    Jafari: {
      name: "Shia Ithna-Ashari, Leva Institute, Qum",
      params: { fajr: 16, isha: 14, maghrib: 4, midnight: "Jafari" },
    },
  };

  private static readonly DEFAULT_PARAMS: Partial<MethodParams> = {
    maghrib: "0 min",
    midnight: "Standard",
  };

  private calcMethod: CalculationMethod = "Makkah";
  private setting: Settings = {
    imsak: "10 min",
    dhuhr: "0 min",
    asr: "Standard",
    highLats: "NightMiddle",
  };
  private timeFormat: TimeFormat = "12h";
  private timeSuffixes = ["am", "pm"];
  private withSuffix = false;
  private invalidTime = "-----";
  private numIterations = 3;
  private offset: TimeOffsets = {};

  private lat = 0;
  private lng = 0;
  private elv = 0;
  private timeZone = 0;
  private jDate = 0;

  constructor(method?: CalculationMethod, options?: PrayTimesOptions) {
    this.initializeDefaults();
    if (method) {
      this.setMethod(method);
    }
    this.initializeOffsets();
    this.withSuffix = options?.withSuffix ?? this.withSuffix;
  }

  private initializeDefaults(): void {
    // Set method defaults
    for (const methodName in PrayTimes.METHODS) {
      const params = PrayTimes.METHODS[methodName as CalculationMethod].params;
      for (const param in PrayTimes.DEFAULT_PARAMS) {
        if (params[param as keyof MethodParams] === undefined) {
          (params as any)[param] =
            PrayTimes.DEFAULT_PARAMS[param as keyof MethodParams];
        }
      }
    }

    // Initialize settings
    const params = PrayTimes.METHODS[this.calcMethod].params;
    for (const id in params) {
      (this.setting as any)[id] = (params as any)[id];
    }
  }

  private initializeOffsets(): void {
    for (const timeName in PrayTimes.TIME_NAMES) {
      this.offset[timeName] = 0;
    }
  }

  setMethod(method: CalculationMethod): void {
    if (PrayTimes.METHODS[method]) {
      this.adjust(PrayTimes.METHODS[method].params);
      this.calcMethod = method;
    }
  }

  adjust(params: Partial<Settings>): void {
    Object.assign(this.setting, params);
  }

  tune(timeOffsets: Partial<TimeOffsets>): void {
    Object.assign(this.offset, timeOffsets);
  }

  getMethod(): CalculationMethod {
    return this.calcMethod;
  }

  getSetting(): Settings {
    return { ...this.setting };
  }

  getOffsets(): TimeOffsets {
    return { ...this.offset };
  }

  getDefaults(): Record<CalculationMethod, Method> {
    return PrayTimes.METHODS;
  }

  getTimes(
    date: Date | [number, number, number],
    coords: [number, number] | [number, number, number],
    timezone?: number | "auto",
    dst?: number | "auto",
    format?: TimeFormat
  ): PrayerTimes {
    this.lat = coords[0];
    this.lng = coords[1];
    this.elv = coords[2] || 0;
    this.timeFormat = format || this.timeFormat;

    let dateArray: [number, number, number];
    if (date instanceof Date) {
      dateArray = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    } else {
      dateArray = date;
    }

    if (timezone === undefined || timezone === "auto") {
      timezone = this.getTimeZone(dateArray);
    }
    if (dst === undefined || dst === "auto") {
      dst = this.getDst(dateArray);
    }

    this.timeZone = Number(timezone) + (Number(dst) || 0);
    this.jDate =
      this.julian(dateArray[0], dateArray[1], dateArray[2]) -
      this.lng / (15 * 24);

    return this.computeTimes();
  }

  getFormattedTime(
    time: number,
    format?: TimeFormat,
    suffixes?: string[]
  ): string {
    if (isNaN(time)) return this.invalidTime;
    if (format === "Float") return time.toString();

    const actualSuffixes = suffixes || this.timeSuffixes;
    const actualFormat = format || this.timeFormat;

    time = DegreeMath.fixHour(time + 0.5 / 60); // add 0.5 minutes to round
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    const suffix =
      actualFormat === "12h" && this.withSuffix
        ? actualSuffixes[hours < 12 ? 0 : 1]
        : "";
    const hour =
      actualFormat === "24h"
        ? this.twoDigitsFormat(hours)
        : ((hours + 12 - 1) % 12) + 1;

    return `${hour}:${this.twoDigitsFormat(minutes)}${
      suffix ? ` ${suffix}` : ""
    }`;
  }

  private midDay(time: number): number {
    const eqt = this.sunPosition(this.jDate + time).equation;
    return DegreeMath.fixHour(12 - eqt);
  }

  private sunAngleTime(angle: number, time: number, direction?: "ccw"): number {
    const decl = this.sunPosition(this.jDate + time).declination;
    const noon = this.midDay(time);
    const t =
      (1 / 15) *
      DegreeMath.arccos(
        (-DegreeMath.sin(angle) -
          DegreeMath.sin(decl) * DegreeMath.sin(this.lat)) /
          (DegreeMath.cos(decl) * DegreeMath.cos(this.lat))
      );
    return noon + (direction === "ccw" ? -t : t);
  }

  private asrTime(factor: number, time: number): number {
    const decl = this.sunPosition(this.jDate + time).declination;
    const angle = -DegreeMath.arccot(
      factor + DegreeMath.tan(Math.abs(this.lat - decl))
    );
    return this.sunAngleTime(angle, time);
  }

  private sunPosition(jd: number): SunPosition {
    const D = jd - 2451545.0;
    const g = DegreeMath.fixAngle(357.529 + 0.98560028 * D);
    const q = DegreeMath.fixAngle(280.459 + 0.98564736 * D);
    const L = DegreeMath.fixAngle(
      q + 1.915 * DegreeMath.sin(g) + 0.02 * DegreeMath.sin(2 * g)
    );

    const e = 23.439 - 0.00000036 * D;
    const RA =
      DegreeMath.arctan2(
        DegreeMath.cos(e) * DegreeMath.sin(L),
        DegreeMath.cos(L)
      ) / 15;
    const eqt = q / 15 - DegreeMath.fixHour(RA);
    const decl = DegreeMath.arcsin(DegreeMath.sin(e) * DegreeMath.sin(L));

    return { declination: decl, equation: eqt };
  }

  private julian(year: number, month: number, day: number): number {
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);

    return (
      Math.floor(365.25 * (year + 4716)) +
      Math.floor(30.6001 * (month + 1)) +
      day +
      B -
      1524.5
    );
  }

  private computePrayerTimes(times: PrayerTimes): PrayerTimes {
    const dayPortionTimes = this.dayPortion(times);
    const params = this.setting;

    return {
      imsak: this.sunAngleTime(
        this.evalParam(params.imsak),
        dayPortionTimes.imsak as number,
        "ccw"
      ),
      fajr: this.sunAngleTime(
        this.evalParam(params.fajr!),
        dayPortionTimes.fajr as number,
        "ccw"
      ),
      sunrise: this.sunAngleTime(
        this.riseSetAngle(),
        dayPortionTimes.sunrise as number,
        "ccw"
      ),
      dhuhr: this.midDay(dayPortionTimes.dhuhr as number),
      asr: this.asrTime(
        this.asrFactor(params.asr),
        dayPortionTimes.asr as number
      ),
      sunset: this.sunAngleTime(
        this.riseSetAngle(),
        dayPortionTimes.sunset as number
      ),
      maghrib: this.sunAngleTime(
        this.evalParam(params.maghrib!),
        dayPortionTimes.maghrib as number
      ),
      isha: this.sunAngleTime(
        this.evalParam(params.isha!),
        dayPortionTimes.isha as number
      ),
    };
  }

  private computeTimes(): PrayerTimes {
    let times: PrayerTimes = {
      imsak: 5,
      fajr: 5,
      sunrise: 6,
      dhuhr: 12,
      asr: 13,
      sunset: 18,
      maghrib: 18,
      isha: 18,
    };

    // Main iterations
    for (let i = 1; i <= this.numIterations; i++) {
      times = this.computePrayerTimes(times);
    }

    times = this.adjustTimes(times);

    // Add midnight time
    times.midnight =
      this.setting.midnight === "Jafari"
        ? (times.sunset as number) +
          this.timeDiff(times.sunset as number, times.fajr as number) / 2
        : (times.sunset as number) +
          this.timeDiff(times.sunset as number, times.sunrise as number) / 2;

    times = this.tuneTimes(times);
    return this.modifyFormats(times);
  }

  private adjustTimes(times: PrayerTimes): PrayerTimes {
    const params = this.setting;

    // Adjust for timezone and longitude
    for (const key in times) {
      (times as any)[key] += this.timeZone - this.lng / 15;
    }

    if (params.highLats !== "None") {
      times = this.adjustHighLats(times);
    }

    if (this.isMin(params.imsak)) {
      times.imsak = (times.fajr as number) - this.evalParam(params.imsak) / 60;
    }
    if (this.isMin(params.maghrib!)) {
      times.maghrib =
        (times.sunset as number) + this.evalParam(params.maghrib!) / 60;
    }
    if (this.isMin(params.isha!)) {
      times.isha =
        (times.maghrib as number) + this.evalParam(params.isha!) / 60;
    }
    times.dhuhr = (times.dhuhr as number) + this.evalParam(params.dhuhr) / 60;

    return times;
  }

  private asrFactor(asrParam: AsrJuristic | string): number {
    const factors: Record<string, number> = { Standard: 1, Hanafi: 2 };
    return factors[asrParam] || this.evalParam(asrParam);
  }

  private riseSetAngle(): number {
    const angle = 0.0347 * Math.sqrt(this.elv); // approximation
    return 0.833 + angle;
  }

  private tuneTimes(times: PrayerTimes): PrayerTimes {
    for (const key in times) {
      (times as any)[key] += this.offset[key] / 60;
    }
    return times;
  }

  private modifyFormats(times: PrayerTimes): PrayerTimes {
    const formattedTimes: PrayerTimes = {} as PrayerTimes;
    for (const key in times) {
      formattedTimes[key as keyof PrayerTimes] = this.getFormattedTime(
        times[key as keyof PrayerTimes] as number,
        this.timeFormat
      );
    }
    return formattedTimes;
  }

  private adjustHighLats(times: PrayerTimes): PrayerTimes {
    const params = this.setting;
    const nightTime = this.timeDiff(
      times.sunset as number,
      times.sunrise as number
    );

    times.imsak = this.adjustHLTime(
      times.imsak as number,
      times.sunrise as number,
      this.evalParam(params.imsak),
      nightTime,
      "ccw"
    );
    times.fajr = this.adjustHLTime(
      times.fajr as number,
      times.sunrise as number,
      this.evalParam(params.fajr!),
      nightTime,
      "ccw"
    );
    times.isha = this.adjustHLTime(
      times.isha as number,
      times.sunset as number,
      this.evalParam(params.isha!),
      nightTime
    );
    times.maghrib = this.adjustHLTime(
      times.maghrib as number,
      times.sunset as number,
      this.evalParam(params.maghrib!),
      nightTime
    );

    return times;
  }

  private adjustHLTime(
    time: number,
    base: number,
    angle: number,
    night: number,
    direction?: "ccw"
  ): number {
    const portion = this.nightPortion(angle, night);
    const timeDiff =
      direction === "ccw"
        ? this.timeDiff(time, base)
        : this.timeDiff(base, time);

    if (isNaN(time) || timeDiff > portion) {
      time = base + (direction === "ccw" ? -portion : portion);
    }
    return time;
  }

  private nightPortion(angle: number, night: number): number {
    const method = this.setting.highLats;
    let portion = 1 / 2; // MidNight

    if (method === "AngleBased") portion = (1 / 60) * angle;
    if (method === "OneSeventh") portion = 1 / 7;

    return portion * night;
  }

  private dayPortion(times: PrayerTimes): PrayerTimes {
    const result: PrayerTimes = {} as PrayerTimes;
    for (const key in times) {
      result[key as keyof PrayerTimes] =
        (times[key as keyof PrayerTimes] as number) / 24;
    }
    return result;
  }

  private getTimeZone(date: [number, number, number]): number {
    const year = date[0];
    const t1 = this.gmtOffset([year, 0, 1]);
    const t2 = this.gmtOffset([year, 6, 1]);
    return Math.min(t1, t2);
  }

  private getDst(date: [number, number, number]): number {
    return Number(this.gmtOffset(date) !== this.getTimeZone(date));
  }

  private gmtOffset(date: [number, number, number]): number {
    const localDate = new Date(date[0], date[1] - 1, date[2], 12, 0, 0, 0);
    const utcString = localDate.toUTCString();
    const utcDate = new Date(
      utcString.substring(0, utcString.lastIndexOf(" ") - 1)
    );
    return (localDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  }

  private evalParam(str: string | number): number {
    return Number(String(str).split(/[^0-9.+-]/)[0]);
  }

  private isMin(arg: string | number): boolean {
    return String(arg).includes("min");
  }

  private timeDiff(time1: number, time2: number): number {
    return DegreeMath.fixHour(time2 - time1);
  }

  private twoDigitsFormat(num: number): string {
    return num < 10 ? `0${num}` : String(num);
  }
}

export default PrayTimes;

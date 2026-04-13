import type { IDatabaseDriver } from "./idatabase-driver.js";

export class DB {
  private static instance: IDatabaseDriver;
  
  static setDriver(driver: IDatabaseDriver) {
    this.instance = driver;
  }

  static get driver(): IDatabaseDriver {
    if(!this.instance) {
      throw new Error("Database driver not set!")
    }
    return this.instance;
  }
}
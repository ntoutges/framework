import * as objUtils from "../objUtils.js";
import { ObjRepo } from "./objRepo.js";

export abstract class Saveable<objectTypes extends string> {
  private readonly initParams = new Map<string,any>();
  private readonly initParamGetters = new Map<string, () => any>();
  private readonly initParamObjectifications = new Map<string, objectTypes>();
  readonly objectRepository = new ObjRepo<objectTypes>();
  private readonly dependencies = new Set<number>();

  protected addInitParams(params: Record<string,any>): void
  protected addInitParams(params: Record<string,any>, delParams: string[] | "*"): void
  protected addInitParams(params: Record<string,any>, delParams: string[] | "*" = null) {
    if (delParams !== null) this.delInitParams(delParams);
    for (const key in params) { this.initParams.set(key, params[key]); }
  }

  protected delInitParams(params: string[] | "*") {
    if (params === "*") params = Array.from(this.initParams.keys()); // remove all params
    for (const key of params) { this.initParams.delete(key); }
  }

  protected addInitParamGetter(params: Record<string,() => any>): void
  protected addInitParamGetter(params: Record<string,() => any>, delParams: string[]): void
  protected addInitParamGetter(params: Record<string,() => any>, delParams: string[] = null) {
    if (delParams != null) this.delInitParamGetter(delParams);
    for (const key in params) this.initParamGetters.set(key, params[key]);
  }

  protected delInitParamGetter(params: string[] | "*") {
    if (params === "*") params = Array.from(this.initParams.keys()); // remove all params
    for (const key of params) { this.initParams.delete(key); }
  }
  
  /**
   * Define which init params will be treated as objects
   * @param keys key gives path to initParam, value gives type (ex: widget)
   */
  protected defineObjectificationInitParams(keys: Record<string,objectTypes>) { Object.keys(keys).forEach(key => this.initParamObjectifications.set(key, keys[key])); }

  /**
   * Define which init params will be treated as objects
   * @param keys array of keys, with subkeys separated by "."
   */
  protected undefineObjectificationInitParams(keys: string[]) { keys.forEach(key => this.initParamObjectifications.delete(key)); }

  protected addDependency(id: number) { if (id !== null) this.dependencies.add(id); }
  protected removeDependency(id: number) { this.dependencies.delete(id); }
  protected setDependencies(...ids: number[]) {
    for (const id of this.dependencies) { this.removeDependency(id); } // remove all
    for (const id of ids) { this.addDependency(id); }                  // add all
  }
  getDependencies() { return Array.from(this.dependencies); }

  save(): Record<string, any> {
    return {
      params: Saveable.save(
        Array.from(this.initParams).reduce(
          (acc, [key,value]) => { acc[key] = value; return acc; },
          Array.from(this.initParamGetters).reduce((acc, [key,getter]) => { acc[key] = getter(); return acc }, {})
        ),
        Array.from(this.initParamObjectifications).reduce((acc, [key,value]) => { acc[key] = value; return acc }, {})
      )
    };
  }

  static save<objectTypes extends string>(obj: Record<string,any>, objectifications: Record<string,objectTypes>) {
    obj = Saveable.deepCopyBaseObject(obj); // make copy of object so as not to modify original

    for (const objectification in objectifications) {
      const segments = objUtils.smartSplit(
        objUtils.smartSplit(objectification, ".", { "\"": "\"" }),
        "*"
      );
      if (Array.isArray(segments[0]) && segments[0].length == 0) segments.shift(); // empty selector, remove it
      
      let roots = [obj];
      for (const i in segments) { // get all but last segment
        const segment = segments[i];
        const isLast = +i == segments.length-1;
        roots = roots.map(root => objUtils.getSubObject(root, isLast ? segment.slice(0,-1) : segment, null)).filter(root => root !== null);
        if (roots == null) continue;

        if (!isLast) roots = roots.map(root => Object.keys(root).map(key => root[key])).flat(1); // add all items
      }

      const type = objectifications[objectification];
      const lastSegment = segments[segments.length-1];
      if (lastSegment.length > 0) {
        const lastKey = lastSegment[lastSegment.length-1];
        roots.forEach(root => {
          if (!root.hasOwnProperty(lastKey) || root[lastKey] == null) return;
          if (typeof root[lastKey] == "function") root[lastKey] = { "$$C": { name: root[lastKey].name, type } }; // class
          else if (typeof root[lastKey] == "object") root[lastKey] = { "$$I": { name: root[lastKey].constructor.name, type } }; // instance
        });
      }
      else {
        roots.forEach(root => {
          for (const lastKey in root) this.buildSavedObject(root, lastKey, type);
        });
      }
    }
    return obj;
  }

  // makes a deep copy of record objects, but ignores other objects (obj.constructor.name == "Object")
  private static deepCopyBaseObject(obj: Record<string, any>): Record<string, any> {
    const copy = {};
    for (const key in obj) {
      copy[key] = Saveable.isBaseObject(obj[key]) ? Saveable.deepCopyBaseObject(obj[key]) : obj[key];
    }

    return copy;
  }

  private static isBaseObject(object: any): object is Record<string,any> {
    return object && typeof object == "object" && (object.constructor.name == "Object" || Array.isArray(object));
  }

  private static buildSavedObject(root: Record<string,any>, lastKey: string, type: string) {
    if (typeof root[lastKey] == "function") root[lastKey] = { "$$C": { name: root[lastKey].name, type } }; // class
    else if (typeof root[lastKey] == "object") { // instance
      const object = { name: root[lastKey].constructor.name, type, data: root[lastKey]?.save() ?? null, dependencies: root[lastKey]?.getDependencies() ?? null };
      if (object.data === null) delete object.data;
      if (object.dependencies === null || !object.dependencies.length) delete object.dependencies;
      root[lastKey] = { "$$I": object };;
    }
  }

  protected static getUnobjectifiedDependencies(object: Record<string, any>) {
    if (object["$$I"] && typeof object["$$I"] === "object") return Saveable.getUnobjectifiedDependencies(object["$$I"]); // get from instance data
    return (object.dependencies && typeof object.dependencies === "object" && Array.isArray(object.dependencies)) ? object.dependencies : []; // given data directly
  }

  // load(state: Record<string,any>) {
  //   const queue: [object: Record<string,any>, lastKey: string][] = Object.keys(state).map(key => [state, key]);

  //   while (queue.length > 0) {
  //     const [obj,lastKey] = queue.pop();
  //     const lastObj = obj[lastKey];

  //     for (const nextKey in lastObj) {
  //       if (typeof lastObj != "object" || lastObj[nextKey] == null) continue; // invalid
        
  //       const objectified = this._objectify(nextKey,lastObj[nextKey]);
  //       if (objectified === null) queue.push([lastObj, nextKey]);
  //       else obj[lastKey] = objectified;
  //     }
  //   }

  //   return this._load(state);
  // }

  objectify(
    state: Record<string,any>,
    preloadRoot: (obj: Saveable<objectTypes>, data: Record<string,any>) => void = null,
    root: Record<string,any> = state
  ) {
    const queue: [obj: Record<string,any>, lastKey: string, nextKeys: string[]][] = Object.keys(state).filter(key => typeof state[key] == "object" && state[key] !== null).map(key => [state, key, Object.keys(state[key])]);
    
    while (queue.length > 0) {
      const [obj, lastKey, nextKeys] = queue[queue.length-1];
      const lastObj = obj[lastKey];
      
      if (nextKeys.length == 0) { // queue empty: objectify
        for (const key in lastObj) {
          const objectified = this._objectify(key, lastObj[key], obj == root ? preloadRoot : null);
          if (objectified !== null) obj[lastKey] = objectified;
        }
        queue.pop(); // get rid of (possibly) objectified element
        continue;

      }

      const nextKey = nextKeys.pop();
      const nextObj = lastObj[nextKey];

      // 'nextObj' is a valid itterable object
      if (typeof nextObj == "object" && nextObj !== null) {
        queue.push([lastObj, nextKey, Object.keys(nextObj)]);
      }
    }
    
    return state;
  }

  private _objectify(
    key: string,
    obj: Record<string,any>,
    preload: (obj: Saveable<objectTypes>, data: Record<string,any>) => void = null
  ) {
    if (key.length < 3 || key.substring(0,2) != "$$") return null; // cannot be objectified
    
    const loadClass = this.objectRepository.getObject(obj.type as objectTypes, obj.name);
    if (loadClass == null) {
      console.error(`Unable to find load class ${obj.type}.${obj.name}`)
      return null;
    }
    switch (key[2]) {
      case "C": // (C)onstructor
        return loadClass.classname;
      case "I": { // (I)instance
        const instance = new loadClass.classname(obj.data.params) as Saveable<objectTypes>;
        if (preload) preload(instance, obj.data);
        instance?.load(obj.data);
        return instance;
      }
    }
    return null;
  }

  abstract load(state: Record<string,any>): void;
}
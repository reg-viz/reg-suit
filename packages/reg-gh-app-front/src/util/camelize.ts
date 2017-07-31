
import * as _ from "lodash";

export function camelize(obj: any): any {
  if (!obj) return obj;
  switch (typeof obj) {
    case "boolean":
    case "number":
    case "string":
    case "symbol":
    case "undefined":
      return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => camelize(item));
  }
  const result = { } as any;
  Object.keys(obj).forEach(k => {
    result[_.camelCase(k)] = camelize(obj[k]);
  });
  return result;
}


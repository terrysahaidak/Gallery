/**
 * @format
 */

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

console.print = (...args) => {
  const d = new Date();
  const date = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()} ---->`;

  console.log(
    date,
    ...args.map((arg) => {
      if (typeof arg === 'object') {
        return JSON.stringify(arg, getCircularReplacer(), 2);
      } else {
        return arg;
      }
    }),
  );
};

import { AppRegistry } from 'react-native';
import App from './Refresh';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

import {Animated} from 'react-native';
const {divide, multiply, sub, add, cond, lessThan} = Animated.E;

function interpolateInternalSingle(value, inputRange, outputRange, offset) {
  const inS = inputRange[offset];
  const inE = inputRange[offset + 1];
  const outS = outputRange[offset];
  const outE = outputRange[offset + 1];
  const progress = divide(sub(value, inS), sub(inE, inS));
  return add(outS, multiply(progress, sub(outE, outS)));
}

function interpolateInternal(value, inputRange, outputRange, offset = 0) {
  if (inputRange.length - offset === 2) {
    return interpolateInternalSingle(value, inputRange, outputRange, offset);
  }
  return cond(
    lessThan(value, inputRange[offset + 1]),
    interpolateInternalSingle(value, inputRange, outputRange, offset),
    interpolateInternal(value, inputRange, outputRange, offset + 1),
  );
}

export function interpolate(
  value: Animated.Value,
  config: Animated.InterpolationConfigType,
) {
  const {inputRange, outputRange} = config;

  let output = interpolateInternal(value, inputRange, outputRange);

  return output;
}

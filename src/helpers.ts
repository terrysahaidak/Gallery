import {Animated, Easing} from 'react-native';
import {State} from 'react-native-gesture-handler';
import {useMemo, useRef} from 'react';

const {E} = Animated;

export function withOffset(
  state: Animated.Value,
  value: Animated.Value,
  offset: Animated.Value,
) {
  return E.cond(
    E.eq(state, State.END),
    E.block([E.set(offset, E.add(offset, value)), offset]),
    E.add(offset, value),
  );
}

export function useGestureEvent(nativeEvent: any) {
  return useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent,
          },
        ],
        {useNativeDriver: true},
      ),
    [],
  );
}

export function useAnimatedValue(
  value: number,
  useListener?: boolean,
  debugLabel?: string,
) {
  const lastValue = useRef(null);

  return useMemo<Animated.Value>(() => {
    const node = new Animated.Value(value);

    if (useListener) {
      node.addListener(value => {
        lastValue.current = value.value;

        if (debugLabel) {
          console.log(debugLabel, value.value);
        }
      });

      node.getValue = () => lastValue.current;
    }

    node.__makeNative();

    return node;
  }, []);
}

function createSpring(value: Animated.Value, toValue: number) {
  return Animated.spring(value, {
    tension: 90,
    friction: 30,
    toValue,
    useNativeDriver: true,
  });
}

function createTiming(value: Animated.Value, toValue: number) {
  return Animated.timing(value, {
    duration: 300,
    toValue,
    easing: Easing.bezier(0.215, 0.61, 0.355, 1),
    useNativeDriver: true,
  });
}

export function useSpring(value: Animated.Value, toValue: number) {
  return useMemo(() => {
    return createSpring(value, toValue);
  }, []);
}

function createSprings(animations: [Animated.Value, number][]) {
  return Animated.parallel(
    animations.map(([value, toValue]) => createSpring(value, toValue)),
  );
}

export function createTimings(animations: [Animated.Value, number][]) {
  return Animated.parallel(
    animations.map(([value, toValue]) => createTiming(value, toValue)),
  );
}

export function useSprings(animations: [Animated.Value, number][], deps = []) {
  return useMemo(() => createSprings(animations), deps);
}

import { Animated, Easing, EasingFunction } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { useMemo, useRef, useEffect } from 'react';

const { E } = Animated;

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

export function useOnFrameExpression(
  expression: () => any,
  deps: any[] = [],
) {
  useEffect(() => {
    const node = Animated.expression(expression());

    node.__attach();

    return () => {
      node.__detach();
    };
  }, deps);
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
        { useNativeDriver: true },
      ),
    [],
  );
}

type NativeEvent = { nativeEvent: any };

export function useAnimatedEvent<
  T extends any,
  TEvent = T extends NativeEvent ? T['nativeEvent'] : T
>(
  nativeEvent: {
    [Key in keyof TEvent]?: TEvent[Key] extends number
      ? Animated.Value
      : {
          [InnerKey in keyof TEvent[Key]]?: Animated.Value;
        };
  },
  listener?: (event: T) => void,
) {
  return useMemo(
    () =>
      Animated.event(
        [
          // @ts-ignore
          {
            nativeEvent,
          },
        ],
        { useNativeDriver: true, listener },
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
      node.addListener((value) => {
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

export function getValue(animatedValue: Animated.Value): number {
  // @ts-ignore
  if (typeof animatedValue.getValue === 'undefined') {
    throw new Error(
      'In order to get value on animated value, listener should be set',
    );
  }
  // @ts-ignore
  return animatedValue.getValue();
}

function createSpring(value: Animated.Value, toValue: number) {
  return Animated.spring(value, {
    tension: 90,
    friction: 30,
    toValue,
    useNativeDriver: true,
  });
}

function createGalleryTiming(value: Animated.Value, toValue: number) {
  return createTiming(value, {
    duration: 300,
    toValue,
    easing: Easing.bezier(0.215, 0.61, 0.355, 1),
  });
}

export function useSpring(value: Animated.Value, toValue: number) {
  return useMemo(() => {
    return createSpring(value, toValue);
  }, []);
}

function createSprings(animations: [Animated.Value, number][]) {
  return Animated.parallel(
    animations.map(([value, toValue]) =>
      createSpring(value, toValue),
    ),
  );
}

export function createTimings(
  animations: [Animated.Value, number][],
) {
  return Animated.parallel(
    animations.map(([value, toValue]) =>
      createGalleryTiming(value, toValue),
    ),
  );
}

export function useSprings(
  animations: [Animated.Value, number][],
  deps = [],
) {
  return useMemo(() => createSprings(animations), deps);
}

export function createTiming(
  value: Animated.Value,
  config: {
    toValue: number;
    duration: number;
    easing?: EasingFunction;
  },
) {
  return Animated.timing(value, {
    ...config,
    useNativeDriver: true,
  });
}

export function useVar<T extends any>(data: () => T) {
  const ref = useRef<T>(null);

  if (ref.current === null) {
    // @ts-ignore
    ref.current = data();
  }

  return ref.current;
}

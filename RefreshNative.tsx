import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Easing,
  NativeScrollEvent,
  EasingFunction,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  NativeViewGestureHandler,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {
  useAnimatedEvent,
  useAnimatedValue,
  useOnFrameExpression,
} from './src/helpers';
import x from 'expression-node.macro';
import Lottie from 'lottie-react-native';
import { interpolate } from './utils';

const { E } = Animated;

// const AnimationState = {
//   IDLE: 0,
//   IN_PROGRESS: 1,
//   FINISHED: 2,
// }

// const timing = (value, config) => {
//   const state = new Animated.Value(0);
//   const progress = new Animated.Value(0);

//   const animation = Animated.parallel([
//     Animated.timing(value, config),
//     Animated.timing(progress, {
//       ...config,
//       toValue: 1,
//     }),
//   ]);

//   animation.state = state;
//   animation.start = (cb) => animation.start(() => {
//     progress.setValue(0);
//     cb && cb();
//   });

//   Animated.expression(
//     cond(
//       eq(progress, 0)
//       block([
//         set(state, AnimationState.IDLE)
//       ]),
//       cond(
//         and(lessThan(progress, 1), neq(state, AnimationState.FINISHED))
//         set(state, AnimationState.IN_PROGRESS)
//         block([
//           set(state, AnimationState.FINISHED),
//         ])
//       )
//     )
//   );
// }

// track progress

const window = Dimensions.get('window');

const s = StyleSheet.create({
  root: {
    paddingTop: Platform.OS === 'android' ? 0 : 44,
    flex: 1,
  },
  scrollContent: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },

  lottie: {
    width: 120,
    height: 120,
    position: 'absolute',
    top: -5,
    alignSelf: 'center',
  },

  box: {
    height: 150,
    width: window.width,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

const items = Array.from({ length: 16 }, (_, index) => index);

function useTiming(
  value: Animated.Value,
  config: {
    toValue: number;
    duration: number;
    easing?: EasingFunction;
  },
) {
  return useMemo(() => {
    return createTiming(value, config);
  }, []);
}

function createTiming(
  value: Animated.Value,
  config: {
    toValue: number;
    duration: number;
    easing?: EasingFunction;
  },
) {
  return Animated.timing(value, {
    // tension: 90,
    // friction: 30,
    ...config,
    useNativeDriver: true,
  });
}

const REFRESH_HEIGHT = 90;
const MAX_OVERSCROLL = 150;

const TRUE = 1;
const FALSE = 0;

function createLogger(
  nodes: { [key: string]: Animated.Value },
  message: string = '',
) {
  const keys = Object.keys(nodes);
  const entries = keys.map((k) => nodes[k]);
  return () =>
    E.call(entries, (arr: number[]) => {
      const values = keys
        .map((k, index) => `${k}: ${arr[index].toFixed(2)}`)
        .join(' ');
      console.log(message, values);
    });
}

function castToBoolean(animatedValue: Animated.Value) {
  const bool = useMemo(() => {
    return Animated.expression(E.boolean(animatedValue));
  }, [animatedValue]);

  return bool;
}

const AnimationState = {
  IN_PROGRESS: 1,
  IDLE: 0,
};

function makeTiming(
  value: Animated.Value,
  config: {
    toValue: number;
    duration: number;
    easing?: EasingFunction;
    beforeAnimationCallback?: () => any;
  },
) {
  const state = new Animated.Value(0);
  state.__makeNative();

  const start = (onEnd) => {
    if (typeof config.beforeAnimationCallback === 'function') {
      config.beforeAnimationCallback();
    }
    Animated.timing(value, {
      ...config,
      useNativeDriver: true,
    }).start(onEnd);
  };

  const running = E.eq(state, AnimationState.IN_PROGRESS);
  const notRunning = E.eq(state, AnimationState.IDLE);

  const beforeAnimation =
    typeof config.beforeAnimationCallback === 'function'
      ? E.call([], () => config.beforeAnimationCallback())
      : E.block([]);

  function expression(onEnd) {
    const onEndBlock = [E.set(state, AnimationState.IDLE)];

    if (typeof onEnd !== 'undefined') {
      onEndBlock.push(
        typeof onEnd === 'function'
          ? E.call([], () => onEnd())
          : onEnd,
      );
    }

    return E.block([
      E.cond(
        notRunning,
        E.block([
          beforeAnimation,
          E.set(state, AnimationState.IN_PROGRESS),
          E.timing(
            value,
            { ...config, useNativeDriver: true },
            E.block(onEndBlock),
          ),
        ]),
      ),
    ]);
  }

  return {
    running,
    notRunning,
    expression,
    start,
  };
}

const App = () => {
  const scrollRef = useRef();
  const animationInProgress = useRef();
  const panRef = useRef<PanGestureHandler>();
  const panY = useAnimatedValue(0, true);
  const marginTop = useAnimatedValue(0, true);
  const scrollY = useAnimatedValue(0, true);
  const panYOffset = useAnimatedValue(0, true);
  const scrollEnabled = useAnimatedValue(1, true);
  const gestureState = useAnimatedValue(0);

  const onGestureEvent = useAnimatedEvent<
    PanGestureHandlerGestureEvent
  >({
    translationY: panY,
  });
  const onScrollEvent = useAnimatedEvent<NativeScrollEvent>({
    contentOffset: { y: scrollY },
  });

  useOnFrameExpression(() => {
    const refreshEndAnimation = makeTiming(marginTop, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
    });

    const refreshAnimation = makeTiming(marginTop, {
      toValue: REFRESH_HEIGHT,
      duration: 300,
      easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
      beforeAnimationCallback: () => {
        panRef.current.setNativeProps({ enabled: false });
      },
    });

    const refreshOnEnd = () =>
      setTimeout(() => {
        // call after request
        refreshEndAnimation.start(() => {
          panRef.current.setNativeProps({ enabled: true });
        });
      }, 1000);

    const noAnimationRunning = x(
      refreshEndAnimation.notRunning && refreshAnimation.notRunning,
    );

    const canRunAnimation = x(
      gestureState === State.END && noAnimationRunning, //&&
      // scrollY === 0,
    );

    const log = createLogger({
      panY,
      panYOffset,
      canRunAnimation,
    });

    return x(() => {
      // log();

      if (noAnimationRunning) {
        if (scrollY === 0) {
          marginTop = panY;
        }
      }

      if (canRunAnimation) {
        if (marginTop >= REFRESH_HEIGHT) {
          refreshAnimation.expression(refreshOnEnd);
        } else {
          refreshEndAnimation.expression();
        }
      }
    });
  });

  const onStateEvent = useAnimatedEvent<
    PanGestureHandlerStateChangeEvent
  >({
    state: gestureState,
  });

  const animationProgress = marginTop.interpolate({
    inputRange: [0, REFRESH_HEIGHT],
    outputRange: [0, 0.5],
  });

  return (
    <>
      <PanGestureHandler
        id="pan"
        ref={panRef}
        // enabled={panEnabled}
        onGestureEvent={onGestureEvent}
        simultaneousHandlers={['scroll']}
        onHandlerStateChange={onStateEvent}
      >
        <Animated.View style={[s.root]}>
          <NativeViewGestureHandler
            disallowInterruption
            // enabled={false}
            ref={scrollRef}
            id="scroll"
            // enabled={false}
            waitFor={[panRef]}
            simultaneousHandlers={['pan']}
          >
            <Animated.ScrollView
              bounces={false}
              // scrollEnabled={castToBoolean(scrollEnabled)}
              onScroll={onScrollEvent}
              scrollEventThrottle={1}
            >
              <Animated.View
                style={[
                  {
                    height: marginTop,
                  },
                ]}
              ></Animated.View>
              <Lottie
                style={s.lottie}
                source={require('./refresh.json')}
                progress={animationProgress}
              />

              {items.map((item) => (
                <View style={s.box} key={item} />
              ))}
            </Animated.ScrollView>
          </NativeViewGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

export default App;

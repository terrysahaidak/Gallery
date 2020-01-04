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
    width: 150,
    height: 150,
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

const REFRESH_HEIGHT = 120;
const MAX_OVERSCROLL = 200;

const TRUE = 1;
const FALSE = 0;

function log(
  message: string,
  nodes: { [key: string]: Animated.Value },
) {
  const keys = Object.keys(nodes);
  const entries = keys.map((k) => nodes[k]);
  return E.call(entries, (arr: number[]) => {
    const values = keys
      .map((k, index) => `${k}: ${arr[index]}`)
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

const App = () => {
  const scrollRef = useRef();
  const panRef = useRef<PanGestureHandler>();
  const panY = useAnimatedValue(0, true);
  const marginTop = useAnimatedValue(0);
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
    const panWithOffset = x(panY - panYOffset);
    const normalizedPan = x(panWithOffset >= 0 ? panWithOffset : 0);

    const min = (a, b) => x(a < b ? a : b);

    const logPan = log('', { marginTop, scrollEnabled, scrollY });

    const canSwipeMore = x(
      gestureState === State.ACTIVE && scrollY <= 0,
    );

    const updateOffset = E.onChange(
      scrollY,
      x(() => {
        panYOffset = panY;
      }),
    );

    return x(() => {
      logPan;
      updateOffset;

      // memoize last panY value in order to subtract it later from the real panY
      // if (gestureState === State.BEGAN) {
      //   panYOffset = scrollY;
      // }

      // check if the user has already scrolled all the way to the top
      if (canSwipeMore) {
        // if so - allow user to scroll more to the top
        // in order to show the refresh controls
        marginTop = E.round(
          panY >= 0 ? min(MAX_OVERSCROLL, normalizedPan) : 0,
        );
      }

      scrollEnabled = E.round(marginTop) > 0 ? FALSE : TRUE;
    });
  });

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state !== State.END) {
        return;
      }

      if (scrollY.getValue() > 0) {
        return;
      }

      const panValue = panY.getValue();
      const refreshEndAnimation = createTiming(marginTop, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
      });

      const refreshAnimation = createTiming(marginTop, {
        toValue: REFRESH_HEIGHT,
        duration: 300,
        easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
      });

      if (panValue >= REFRESH_HEIGHT) {
        panRef.current.setNativeProps({ enabled: false });

        refreshAnimation.start(() => {
          // do request here
          setTimeout(() => {
            // call after request

            refreshEndAnimation.start(() => {
              panRef.current.setNativeProps({ enabled: true });
            });
          }, 1000);
        });
      } else {
        refreshEndAnimation.start();
      }
    },
    [],
  );

  const onStateEvent = useAnimatedEvent<
    PanGestureHandlerStateChangeEvent
  >(
    {
      state: gestureState,
    },
    onHandlerStateChange,
  );

  const animationProgress = marginTop.interpolate({
    inputRange: [0, REFRESH_HEIGHT],
    outputRange: [0, 0.5],
  });

  // const  = marginTop.interpolate({
  //   inputRange: [0, REFRESH_HEIGHT],
  //   outputRange: [0, 0.5],
  // });

  return (
    <>
      <PanGestureHandler
        id="pan"
        ref={panRef}
        onGestureEvent={onGestureEvent}
        simultaneousHandlers={['scroll']}
        onHandlerStateChange={onStateEvent}
      >
        <Animated.View style={[s.root]}>
          <Animated.View
            style={[
              {
                height: marginTop,
              },
            ]}
          ></Animated.View>
          <NativeViewGestureHandler
            ref={scrollRef}
            id="scroll"
            simultaneousHandlers={['pan']}
          >
            <Animated.ScrollView
              bounces={false}
              scrollEnabled={castToBoolean(scrollEnabled)}
              onScroll={onScrollEvent}
            >
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

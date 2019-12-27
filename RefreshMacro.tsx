import React, {useRef, useMemo, useState, useCallback, useEffect} from 'react';
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

const {E} = Animated;

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
    paddingTop: Platform.OS === 'android' ? 0 : 20,
    flex: 1,
  },
  scrollContent: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },

  box: {
    height: 150,
    width: window.width / 2,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

const items = Array.from({length: 16}, (_, index) => index);

function useTiming(
  value: Animated.Value,
  config: {toValue: number; duration: number; easing?: EasingFunction},
) {
  return useMemo(() => {
    return Animated.timing(value, {
      // tension: 90,
      // friction: 30,
      ...config,
      useNativeDriver: true,
    });
  }, []);
}

const REFRESH_HEIGHT = 120;
const MAX_OVERSCROLL = 200;

const App = () => {
  const scrollRef = useRef();
  const panRef = useRef();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const panY = useAnimatedValue(0, true);
  const marginTop = useAnimatedValue(0);
  const scrollY = useAnimatedValue(0, true);
  const panYOffset = useAnimatedValue(0);
  const gestureState = useAnimatedValue(0);

  const onGestureEvent = useAnimatedEvent<PanGestureHandlerGestureEvent>({
    translationY: panY,
  });
  const onScrollEvent = useAnimatedEvent<NativeScrollEvent>({
    contentOffset: {y: scrollY},
  });

  const refreshEndAnimation = useTiming(marginTop, {
    toValue: 0,
    duration: 300,
    easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
  });

  const refreshAnimation = useTiming(marginTop, {
    toValue: REFRESH_HEIGHT,
    duration: 300,
    easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
  });

  // prettier-ignore
  useOnFrameExpression(() => {
    const normalizedPan = x(panY - panYOffset);
  
    const min = (a, b) => x(a < b ? a : b);
  
    const canSwipeMore = x(
      gestureState === State.ACTIVE && scrollY <= 0,
    );
  
    return x(() => {
      // memoize last panY value in order to subtract it later from the real panY
      if (gestureState === State.BEGAN) {
        panYOffset = scrollY;
      }
  
      // check if the user has already scrolled all the way to the top
      if (canSwipeMore) {
        // if so - allow user to scroll more to the top
        // in order to show the refresh controls
        marginTop = panY >= 0 ? min(MAX_OVERSCROLL, normalizedPan) : 0;
      }
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

      if (panValue >= REFRESH_HEIGHT) {
        setIsRefreshing(true);
        refreshAnimation.start(() => {
          // do request here
          setTimeout(() => {
            // call after request

            refreshEndAnimation.start(() => {
              setIsRefreshing(false);
            });
          }, 1000);
        });
      } else {
        refreshEndAnimation.start();
      }
    },
    [],
  );

  const onStateEvent = useAnimatedEvent<PanGestureHandlerStateChangeEvent>(
    {
      state: gestureState,
    },
    onHandlerStateChange,
  );

  return (
    <>
      <PanGestureHandler
        ref={panRef}
        enabled={!isRefreshing}
        onGestureEvent={onGestureEvent}
        simultaneousHandlers={[scrollRef]}
        onHandlerStateChange={onStateEvent}>
        <Animated.View style={[s.root]}>
          <NativeViewGestureHandler
            ref={scrollRef}
            simultaneousHandlers={[panRef]}>
            <Animated.ScrollView bounces={false} onScroll={onScrollEvent}>
              <Animated.View
                style={[
                  {
                    marginTop,
                  },
                ]}>
                {items.map(item => (
                  <View style={s.box} key={item} />
                ))}
              </Animated.View>
            </Animated.ScrollView>
          </NativeViewGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

export default App;

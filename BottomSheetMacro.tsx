// @ts-nocheck
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
  createTiming,
} from './src/helpers';
import x from 'expression-node.macro';

const { E } = Animated;

const AnimatedPan = Animated.createAnimatedComponent(
  PanGestureHandler,
);

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

const App = () => {
  const scrollRef = useRef();
  const scrollViewRef = useRef();
  const panRef = useRef<PanGestureHandler>();
  const panY = useAnimatedValue(0, true);
  const scrollEnabled = useAnimatedValue(
    false,
    true,
    'Scroll enabled',
  );
  const gestureHandlerEnabled = useAnimatedValue(0, true);
  const translateY = useAnimatedValue(400, true);
  const scrollY = useAnimatedValue(0, true);
  const panYOffset = useAnimatedValue(0);
  const scrollYOffset = useAnimatedValue(0);
  const gestureState = useAnimatedValue(0);

  const onGestureEvent = useAnimatedEvent<
    PanGestureHandlerGestureEvent
  >(
    {
      translationY: panY,
    },
    // (event) => {
    //   if (event.nativeEvent.translationY < -150) {
    //     console.log('Disabled');
    //     panRef.current.setNativeProps({ enabled: false });
    //     scrollRef.current.setNativeProps({ scrollEnabled: true });
    //   }
    // },
  );
  const onScrollEvent = useAnimatedEvent<NativeScrollEvent>({
    contentOffset: { y: scrollY },
  });

  useOnFrameExpression(() => {
    const normalizedPan = x(panYOffset + panY - scrollYOffset);

    const isSwiping = x(gestureState === State.ACTIVE);

    const atTopEdge = x(normalizedPan <= 0);
    const atBottomEdge = x(normalizedPan >= 400);
    const gestureEnabled = x(scrollY === 0);

    const swipeUp = x(panY < 0);
    const swipeDown = x(panY > 0);

    return x(() => {
      // memoize last panY value in order to subtract it later from the real panY
      if (gestureState === State.BEGAN) {
        panYOffset = translateY;
        scrollYOffset = scrollY;
      }

      if (isSwiping) {
        if (atTopEdge) {
          translateY = 0;
          scrollEnabled = 1;
          // gestureHandlerEnabled = Boolean(false);
        } else if (atBottomEdge) {
          translateY = 400;
        } else if (gestureEnabled) {
          scrollEnabled = 0;
          // gestureHandlerEnabled = Boolean(true);
          translateY = normalizedPan;
        }
      }
    });
  });

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state !== State.END) {
        return;
      }

      const panValue = panY.getValue();
      const translateValue = translateY.getValue();

      const swipeUp = panValue < 0;
      const swipeDown = panValue > 0;

      if (swipeUp && translateValue !== 400) {
        createTiming(translateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
        }).start(() => {
          // scrollEnabled.setValue(1);
        });
      } else if (swipeDown && translateValue !== 0) {
        createTiming(translateY, {
          toValue: 400,
          duration: 300,
          easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
        }).start();
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
  // scrollViewRef.current.setNativeProps({ scrollEnabled: false });

  return (
    <>
      <PanGestureHandler
        ref={panRef}
        // enabled={gestureHandlerEnabled}
        onGestureEvent={onGestureEvent}
        simultaneousHandlers={[scrollRef]}
        onHandlerStateChange={onStateEvent}
      >
        <Animated.View
          style={[
            s.root,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          <NativeViewGestureHandler
            ref={scrollRef}
            // waitFor={[panRef]}
            simultaneousHandlers={[panRef]}
          >
            <Animated.ScrollView
              ref={scrollViewRef}
              bounces={false}
              scrollEnabled={scrollEnabled}
              scrollEventThrottle={1}
              onScroll={onScrollEvent}
            >
              <Animated.View>
                {items.map((item) => (
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

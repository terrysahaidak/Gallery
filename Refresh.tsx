import React, {useRef, useMemo, useState, useCallback} from 'react';
import {Animated, View, StyleSheet, Dimensions} from 'react-native';
import {
  PanGestureHandler,
  State,
  NativeViewGestureHandler,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';

const {E} = Animated;

const window = Dimensions.get('window');

function useAnimatedEvent(nativeEvent: any) {
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

function useAnimatedValue(
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

const s = StyleSheet.create({
  root: {
    paddingTop: 20,
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

function useSpring(value: Animated.Value, config: {toValue: number}) {
  return useMemo(() => {
    return Animated.spring(value, {
      tension: 90,
      friction: 30,
      ...config,
      useNativeDriver: true,
    });
  }, []);
}

const REFRESH_HEIGHT = 120;

function withOffset(
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

const App = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const panY = useAnimatedValue(0, true);
  const marginTop = useAnimatedValue(0, true, 'Margin');
  const scrollY = useAnimatedValue(0, true);
  const gestureState = useAnimatedValue(-1, true);

  const onGestureEvent = useAnimatedEvent({
    state: gestureState,
    translationY: panY,
  });
  const onScrollEvent = useAnimatedEvent({
    contentOffset: {y: scrollY},
  });

  const marginTopWithOffset = Animated.expression(
    withOffset(gestureState, panY, marginTop),
  );

  const refreshEndAnimation = useSpring(panY, {
    toValue: 0,
  });
  const refreshAnimation = useSpring(panY, {
    toValue: REFRESH_HEIGHT,
  });

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.END) {
        if (scrollY.getValue() <= 0) {
          const panValue = panY.getValue();

          if (panValue >= REFRESH_HEIGHT) {
            setIsRefreshing(true);
            refreshAnimation.start(() => {
              // do request here
              setTimeout(() => {
                // call after request
                setIsRefreshing(false);
                refreshEndAnimation.start();
              }, 1000);
            });
          } else {
            refreshEndAnimation.start();
          }
        }
      }
    },
    [],
  );

  return (
    <>
      <Animated.View
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'green',
          borderRadius: marginTopWithOffset,
        }}
      />
      <PanGestureHandler
        id="pan"
        enabled={!isRefreshing}
        onGestureEvent={onGestureEvent}
        simultaneousHandlers={['scroll']}
        onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={[s.root]}>
          <NativeViewGestureHandler id="scroll" simultaneousHandlers={['pan']}>
            <Animated.ScrollView bounces={false} onScroll={onScrollEvent}>
              <Animated.View
                style={[
                  {
                    marginTop: marginTopWithOffset,
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

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {
  State,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import x from 'expression-node.macro';
import {
  useAnimatedValue,
  useAnimatedEvent,
  useOnFrameExpression,
  useVar,
  createTiming,
  getValue,
} from './src/helpers';

const { E } = Animated;

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    flexDirection: 'row',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
  },
});

interface PageProps {
  item: { id: number; text: string; bg: string };
}

function Page({ item }: PageProps) {
  return (
    <View style={[s.page, { width, backgroundColor: item.bg }]}>
      <Text style={s.text}>{item.text}</Text>
    </View>
  );
}

const pages = [
  { id: 1, text: 'Hey!', bg: 'green' },
  { id: 2, text: 'Ho!', bg: 'red' },
  { id: 3, text: 'La!', bg: 'black' },
];

function getNextIndex(
  panValue: number,
  currentIndex: number,
  maxValue: number,
) {
  if (panValue > 0) {
    if (currentIndex === 0) {
      return currentIndex;
    } else {
      return currentIndex - 1;
    }
  } else if (currentIndex === maxValue - 1) {
    return currentIndex;
  }

  return currentIndex + 1;
}

function getAnimation(value: Animated.Value, toValue: number) {
  return createTiming(value, {
    toValue,
    duration: 450,
    easing: Easing.bezier(0.17, 0.91, 0.55, 0.97),
  });
}

export default function App() {
  const pagerState = useVar(() => ({ index: 0 }));
  const panX = useAnimatedValue(0, true);
  const gestureState = useAnimatedValue(-1);
  const translateX = useAnimatedValue(0, true);
  const offset = useAnimatedValue(0);

  const onGestureEvent = useAnimatedEvent<
    PanGestureHandlerGestureEvent
  >({
    translationX: panX,
  });

  const maxTranslateX = -width * (pages.length - 1);

  useOnFrameExpression(() => {
    const normalizedPan = x(panX + offset);
    const notOverswipe = x(
      normalizedPan <= 0 && normalizedPan > maxTranslateX,
    );

    return x(() => {
      if (gestureState === State.BEGAN) {
        // memoize last translate value
        // in order to pan be added later
        offset = translateX;
      }

      if (gestureState === State.ACTIVE && notOverswipe) {
        // update translate as pan move
        translateX = normalizedPan;
      }
    });
  });

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state !== State.END) {
        return;
      }

      const panValue = getValue(panX);
      const translateValue = getValue(translateX);

      const { index } = pagerState;
      const nextIndex = getNextIndex(panValue, index, pages.length);
      const nextValue = -width * nextIndex;

      if (translateValue === nextValue) {
        return;
      }

      const nextPageAnimation = getAnimation(translateX, nextValue);

      nextPageAnimation.start(() => {
        pagerState.index = nextIndex;
      });
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

  return (
    <PanGestureHandler
      maxPointers={1}
      onHandlerStateChange={onStateEvent}
      onGestureEvent={onGestureEvent}
    >
      <Animated.View
        style={[
          s.container,
          { width: width * pages.length + 1 },
          { transform: [{ translateX }] },
        ]}
      >
        {pages.map((item) => (
          <Page key={item.id} item={item} />
        ))}
      </Animated.View>
    </PanGestureHandler>
  );
}

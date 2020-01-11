import React, { useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  NativeViewGestureHandler,
} from 'react-native-gesture-handler';

const { E } = Animated;

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

const App = () => {
  const scrollRef = useRef();
  const panRef = useRef<PanGestureHandler>();
  const panY = new Animated.Value(0);
  const translateY = new Animated.Value(0);
  const scrollY = new Animated.Value(0);
  scrollY.addListener((value) => console.log('Scroll', value));

  Animated.useExpression(() => E.set(translateY, panY), [], true);

  return (
    <>
      <PanGestureHandler
        id="pan"
        ref={panRef}
        onGestureEvent={Animated.event(
          [
            {
              nativeEvent: {
                translationY: panY,
              },
            },
          ],
          {
            useNativeDriver: true,
          },
        )}
        simultaneousHandlers={['scroll']}
      >
        <Animated.View
          style={[
            s.root,
            {
              transform: [
                {
                  translateY,
                },
              ],
            },
          ]}
        >
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
              onScroll={Animated.event(
                [
                  {
                    nativeEvent: {
                      contentOffset: {
                        y: scrollY,
                      },
                    },
                  },
                ],
                {
                  useNativeDriver: true,
                },
              )}
              scrollEventThrottle={1}
              style={{}}
            >
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

import React, {useEffect, useState} from 'react';
import {Animated, Button} from 'react-native';

const {E} = Animated;

import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';

let count = 0;
const spyFunction = msg => {
  if (msg.module === 'NativeAnimatedModule') {
    console.log(++count, msg);
  }
};

MessageQueue.spy(spyFunction);

const App = () => {
  const [show, setShow] = useState(false);
  const borderRadius = new Animated.Value(0);
  const width = new Animated.Value(100);

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(borderRadius, {
          toValue: 50,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(width, {
          toValue: 50,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('Finish');
      });
    }
  }, [show]);

  if (!show) {
    return <Button title="Show" onPress={() => setShow(true)} />;
  }

  return (
    <>
      <Animated.View
        style={{
          width,
          height: 100,
          backgroundColor: 'red',
          borderRadius: borderRadius.interpolate({
            inputRange: [0, 50],
            outputRange: [50, 0],
          }),
        }}
      />
    </>
  );
};

export default App;

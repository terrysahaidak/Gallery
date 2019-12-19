import React, {
  useRef,
  MutableRefObject,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  Animated,
  View,
  StyleSheet,
  ScrollView,
  UIManager,
  findNodeHandle,
  Dimensions,
  Platform,
} from 'react-native';
import Image from 'react-native-fast-image';
import {
  TouchableOpacity,
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {interpolate} from './utils';

// import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';

// let count = 0;
// const spyFunction = msg => {
//   if (msg.module === 'NativeAnimatedModule') {
//     console.log(++count, msg);
//   }
// };

// MessageQueue.spy(spyFunction);

const {E} = Animated;

const window = Dimensions.get('window');

const images = [
  {
    id: 1,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 2,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 3,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 4,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 5,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 6,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 7,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 8,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
];

interface IImage {
  id: number;
  src: string;
  width: number;
  height: number;
}

const s = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
  },

  root: {
    opacity: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  galleryContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  close: {
    position: 'absolute',
    left: 16,
    top: 36,
    fontSize: 17,
    color: 'white',
  },
});

interface SmallImageProps {
  item: IImage;
  onPress: (ref: TouchableRef, item: IImage) => void;
  width: number;
  height: number;
}

type TouchableRef = MutableRefObject<TouchableOpacity | null>;

const SmallImage = ({item, onPress, width, height}: SmallImageProps) => {
  const ref = useRef(null);

  const handlePress = () => {
    onPress(ref, item);
  };

  return (
    <View
      onLayout={() => {}}
      removeClippedSubviews={false}
      ref={ref}
      style={{opacity: 1}}>
      <TouchableOpacity onPress={handlePress}>
        <Image source={{uri: item.src}} style={[s.image, {width, height}]} />
      </TouchableOpacity>
    </View>
  );
};

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

interface ITargetDimensions {
  targetHeight: number;
  targetWidth: number;
}

interface IViewDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

type IDimensions = ITargetDimensions & IViewDimensions;

interface GalleryProps {
  componentRef: TouchableRef;
  item: IImage;
  onClose: () => void;
}

function createSpring(value: Animated.Value, toValue: number) {
  return Animated.spring(value, {
    tension: 90,
    friction: 30,
    toValue,
    useNativeDriver: true,
  });
}

function useSpring(value: Animated.Value, toValue: number) {
  return useMemo(() => {
    return createSpring(value, toValue);
  }, []);
}

function createSprings(animations: [Animated.Value, number][]) {
  return Animated.parallel(
    animations.map(([value, toValue]) => createSpring(value, toValue)),
  );
}

function useSprings(animations: [Animated.Value, number][], deps = []) {
  return useMemo(() => createSprings(animations), deps);
}

function Gallery({componentRef, item, onClose}: GalleryProps) {
  const [dimensions, setDimensions] = useState<IDimensions>();
  const transition = useAnimatedValue(0);
  const onCloseRef = useRef();

  useEffect(() => {
    if (!dimensions) {
      const nodeId = findNodeHandle(componentRef.current);

      if (nodeId === null) {
        throw new Error('NodeId cannot be null');
      }

      UIManager.measure(nodeId, (x, y, width, height, pageX, pageY) => {
        const targetWidth = window.width;
        const scaleFactor = item.width / targetWidth;
        const targetHeight = item.height / scaleFactor;

        setDimensions({
          width,
          height,
          x: pageX,
          y: pageY,
          targetHeight,
          targetWidth,
        });
      });
    }
  }, []);

  const opacity = transition.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <Animated.View style={[s.galleryContainer]}>
      <Animated.View
        style={{
          opacity,
          flex: 1,
          backgroundColor: 'black',
          ...StyleSheet.absoluteFillObject,
        }}
      />
      {dimensions && (
        <GalleryImage
          dimensions={dimensions}
          transition={transition}
          onClose={onClose}
          onCloseRef={onCloseRef}
          item={item}
        />
      )}

      <Animated.Text
        onPress={() => onCloseRef.current?.()}
        style={[s.close, {opacity}]}>
        Close
      </Animated.Text>
    </Animated.View>
  );
}

function useGestureEvent(nativeEvent: any) {
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

interface ImageProps {
  item: IImage;
  dimensions: IDimensions;
  transition: Animated.Value;
}

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

const GalleryImage = ({
  item,
  transition,
  dimensions,
  onClose,
  onCloseRef,
}: ImageProps) => {
  const panY = useAnimatedValue(0, true);
  const gestureState = useAnimatedValue(-1);
  const translateY = useAnimatedValue(dimensions.y, true);
  const translateX = useAnimatedValue(dimensions.x);
  const imageWidth = useAnimatedValue(dimensions.width);
  const imageHeight = useAnimatedValue(dimensions.height);

  const onGestureEvent = useGestureEvent({
    state: gestureState,
    translationY: panY,
  });

  const translateWithOffset = Animated.expression(
    withOffset(gestureState, panY, translateY),
  );

  const imageTranslateYPosition = (window.height - dimensions.targetHeight) / 2;

  const openAnimation = useSprings([
    [transition, 1],
    [translateY, imageTranslateYPosition],
    [translateX, 0],
    [imageWidth, dimensions.targetWidth],
    [imageHeight, dimensions.targetHeight],
  ]);

  function handleClose() {
    const closeAnimation = createSprings([
      [transition, 0],
      [translateY, dimensions.y - panY.getValue()],
      [translateX, dimensions.x],
      [imageWidth, dimensions.width],
      [imageHeight, dimensions.height],
    ]);

    closeAnimation.start(() => {
      onClose();
    });
  }

  onCloseRef.current = handleClose;

  const dismissCloseAnimation = useSpring(panY, 0);

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.END) {
        if (panY.getValue() > 50) {
          handleClose();
        } else {
          dismissCloseAnimation.start(() => {});
        }
      }
    },
    [],
  );

  useEffect(() => {
    openAnimation.start(() => {});
  }, []);

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.Image
        source={{uri: item.src}}
        style={{
          width: imageWidth,
          height: imageHeight,
          transform: [{translateX}, {translateY: translateWithOffset}],
        }}
      />
    </PanGestureHandler>
  );
};

const App = () => {
  const [galleryProps, setGalleryProps] = useState<GalleryProps | null>(null);

  function onImagePress(ref: TouchableRef, item: IImage) {
    setGalleryProps({
      componentRef: ref,
      item,
      onClose: () => setGalleryProps(null),
    });
  }

  const size = window.width / 3;

  return (
    <>
      <View removeClippedSubviews={false} style={s.root}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          {images.map(item => (
            <SmallImage
              width={size}
              height={size}
              key={item.id}
              onPress={onImagePress}
              item={item}
            />
          ))}
        </ScrollView>
      </View>
      {galleryProps && <Gallery key={galleryProps.item.id} {...galleryProps} />}
    </>
  );
};

export default App;
